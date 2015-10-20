/**
 * Created by andri on 10/15/15.
 * Ignore this. This is for me to try stuffs.
 */

var express = require("express")
    , app = express()
    , Firebase = require("firebase")
    , Switch = require("./lib/Switch")

var wpi = require('wiring-pi');
wpi.setup('gpio');

var ledPin = 26;
//var ledPin = 5;
wpi.pinMode(ledPin, wpi.OUTPUT);

var ledValue = 0;
wpi.digitalWrite(ledPin, ledValue);

function toggle() {
    ledValue = +!ledValue;
    wpi.digitalWrite(ledPin, ledValue);
}

function setState(state) {
    ledValue = +state;
    wpi.digitalWrite(ledPin, ledValue);
}

//var theSwitch = new Switch(5);
//theSwitch.switchOff();


//Firebase
var deviceId = "smartled1";

var myFirebaseRef = new Firebase("https://dycode-iot.firebaseio.com");
var devicesFirebaseRef = myFirebaseRef.child("explore");

var deviceRef = devicesFirebaseRef.child(deviceId);

//Just a random metadata
var deviceMetadata = {
    "objectType": "DeviceInfo",
    "isSimulatedDevice": 0,
    "version": "1.0",
    "properties": {
        "deviceID": deviceId,
        "name": "Smart LED",
        "types": ["SmartLamp", "Switch"],
        "hubEnabledState": 1,
        "createdTime": new Date().toISOString(),
        "deviceState": "normal",
        "updatedTime": new Date().toISOString(),
        "manufacturer": "DycodeX",
        "modelNumber": "SL-909",
        "serialNumber": "SER9090",
        "firmwareVersion": "1.10",
        "platform": "node.js",
        "processor": "ARM",
        "latitude": 47.617025,
        "longitude": -122.191285
    },
    "commands": [
        { "name": "setState", "parameters": [{ "name": "state", "type": "boolean" }] },
        { "name": "enableLightSensor", "parameters": [{ "name": "lightSensorEnabled", "type": "boolean" }] }
    ],
    "parameters": [
        { "name": "state", "type": "boolean"},
        { "name": "lightSensorEnabled", "type": "boolean" }
    ]
};

//register device's metadata
deviceRef.child("metadata").set(deviceMetadata, function(err) {
    if (err) {
        console.err(err);
    }
    else {
        //register paramaters
        var params = {};
        deviceMetadata.parameters.forEach(function(param) {
            var defVal = param.type === "boolean"? false: (param.type === "number"? 0: "");
            params[param.name] = defVal;
        });

        deviceRef.child("parameters").set(params, function(err) {
            if (!err) {
                listenForParameterChanges();
            }
        });
    }
});


function listenForParameterChanges() {
    var myDevParamsRef = deviceRef.child("parameters");
    myDevParamsRef.on("child_changed", function(snapshot) {
        //console.log(snapshot.key())
        //console.log(snapshot.val());
        if (snapshot.key() == "state") {
            setState(snapshot.val());
        }
    });
}


//MCP3008 ADC
var currentReadAdcZero = 0;

wpi.mcp3004Setup(200, 0);

function readAdcZero() {
    var total = 0;
    var count = 1024;
    for (var i = 0; i < count; i++) {
        total += wpi.analogRead(200);
    }

    currentReadAdcZero = total * 1.0 / count;
    console.log(currentReadAdcZero);
}

function readCurrentSensor(channel) {

    //var adc = wpi.analogRead(200 + channel);
    //var mA = (3.4 / 189.44) * (adc - currentReadAdcZero) * 1000;
    //return mA;

    //var CS_READ_SAMPLE_NUM = 255;
    //
    //var currentTotal = 0;
    //for (var i = 0; i < CS_READ_SAMPLE_NUM; i++) {
    //    var readCS = wpi.analogRead(200 + channel) - currentReadAdcZero;
    //    currentTotal += (readCS * readCS);
    //}
    //
    ////This formula is retrieved by doing linear regression. Specific for ACS712 5A
    //var rmsCS = (Math.sqrt(1.0 * currentTotal / CS_READ_SAMPLE_NUM) - 1.7543) / 0.259;
    //
    ////return in milliampere. Substracted by magic number I got for zero current.
    //
    //return rmsCS;

    var analogReadAmplitude = 0, min = currentReadAdcZero, max = currentReadAdcZero, filter = 4;
    var hz = 50;
    var sensitivity = 185;

    var start = Date.now();
    do {
        var val = 0;
        for (var i = 0; i < filter; i++)
        val += wpi.analogRead(200 + channel);
        val = (val / filter);     // fine tuning of 0A AC reading! 512 = 0V
        if (max < val) max = val;
        if (val < min) min = val;

    } while (Date.now() - start <= 1100/hz);     //10% + to ensure p2p is acquired

    analogReadAmplitude = (max - min) / 2;

    var internalVcc = 1687*2;                         // should be around 5000
    var sensedVoltage = (analogReadAmplitude * internalVcc) / 1024;     // (analogReadAmplitude/2) * 5000 / 1024               -> 0: 0               1024: 5000
    var sensedCurrent = sensedVoltage / sensitivity;

    //var analogRead = wpi.analogRead(200 + channel);
    //mA = ((analogRead * (1687*2) / 1024) - 1687 ) / 187;

    return sensedCurrent;
}

readAdcZero();

setInterval(function() {
    var currentA = readCurrentSensor(0);
    console.log("Current: ", currentA * 1000);

    var ldr = wpi.analogRead(201);
    console.log("LDR: ", ldr);

    var wattage = Math.abs(currentA * 220 - 17);
    console.log("Wattage: ", wattage);

    var telemetry = {
        wattage: wattage,
        ldr: ldr
    }

    deviceRef.child("telemetry/latest").set(telemetry, function(err) {
        if (!err) {

        }
        else {
            console.error(err);
        }
    });

}, 5000);

//Express routes
app.get("/", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send('Hello there. Nothing here...');
});

app.get("/toggle", function (req, res) {

    toggle();
    var isOn = ledValue;

    res.set('Content-Type', 'text/plain');
    res.send('Switch value: ' + isOn + '\n');
});

var server = app.listen(1337, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});
