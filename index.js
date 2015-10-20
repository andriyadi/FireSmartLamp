/**
 * Created by andri on 10/15/15.
 */

var express = require("express")
    , app = express()
    , Firebase = require("firebase")


//For working with GPIO from Node.js, I use WiringPi wrapper module. You're welcome to use another module, change respective all gpio calls accordingly.
//More info: https://github.com/eugeneware/wiring-pi
//To use this module, you MUST install wiring-pi http://wiringpi.com/download-and-install/

var wpi = require('wiring-pi')
wpi.setup('gpio');

var ledPin = 26; //26 is pin to LED
//var ledPin = 5; //5 is pin to AC switch

wpi.pinMode(ledPin, wpi.OUTPUT);

//1. Turn off/on the LED directly
var ledValue = 0;
wpi.digitalWrite(ledPin, ledValue);

//2. Function to switch off/on
function setState(state) {
    ledValue = +state; //convert true/false to appropriate integer
    wpi.digitalWrite(ledPin, ledValue);
}

// 3. Express routes
app.get("/", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send('Hello there. Nothing here...');
});

app.get("/switch/:state", function (req, res) {

    var isOn = parseInt(req.params.state);
    setState(isOn);

    res.set('Content-Type', 'text/plain');
    res.send('Switch value: ' + isOn + '\n');
});

//Start the http server
var server = app.listen(1337, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});


//4. Get Firebase Ref
var deviceId = "smartled1";

var myFirebaseRef = new Firebase("https://dycode-iot.firebaseio.com");
var devicesFirebaseRef = myFirebaseRef.child("devices");

var deviceRef = devicesFirebaseRef.child(deviceId);
console.log("Device Firebase URL: " + deviceRef.toString());

//5. Create a arbitrary metadata
var deviceDesc = {
    "metadata": {
        "properties": {
            "deviceID": deviceId,
            "name": "Smart LED",
            "types": ["SmartLamp", "Switch"],
            "manufacturer": "DycodeX",
            "serialNumber": "SER9090",
            "latitude": 47.617025,
            "longitude": -122.191285
        }
    },
    "parameter": {
        lightSensorEnabled: false,
        state: false
    }
};

//6. Register device's metadata and parameters to control
deviceRef.set(deviceDesc, function(err) {
    if (err) {
        console.err(err);
    }
    else {

        //register listener for paramaters change
        listenForParameterChanges();
    }
});

//7. Listening function of parameters change from Firebase
function listenForParameterChanges() {
    var myDevParamsRef = deviceRef.child("parameters");
    myDevParamsRef.on("child_changed", function(snapshot) {
        console.log(snapshot.key())
        console.log(snapshot.val());

        if (snapshot.key() == "state") {
            setState(snapshot.val());
        }
        else if (snapshot.key() == "lightSensorEnabled") {
            setLightSensorEnabled(snapshot.val());
        }
    });
}


//8. Current sensor for telemetry

var CurrentSensor = require('./lib/CurrentSensor');
var cs = new CurrentSensor(0);
var currentA = cs.readCurrent();
console.log("Current: ", currentA);


//9. Regularly send device's telemetry

setInterval(function() {
    var currentA = cs.readCurrent();
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


//10. Handle LDR
var ldrCheckIntervalId = undefined;
function setLightSensorEnabled(enabled) {
    if (!enabled) {
        if (ldrCheckIntervalId) {
            clearInterval(ldrCheckIntervalId);
            ldrCheckIntervalId = undefined;
        }
    }
    else {
        ldrCheckIntervalId = setInterval(function() {
            var ldr = wpi.analogRead(201);
            console.log("LDR: ", ldr);
            if (ldr < 200) {
                //setState(true);
                //set firebase instead
                var params = {
                    state: true,
                    lightSensorEnabled: true,
                };

                deviceRef.child("parameters").set(params, function(err) {
                });
            }

        }, 500);
    }
}
