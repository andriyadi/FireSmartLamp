/**
 * Created by andri on 10/17/15.
 * A class for reading from current sensor of ACS712 module.
 * To read AC current, proper AC riding (of sinusoidal wave) mechanism should be done.
 */

'use strict';

var wpi = require('wiring-pi');

var ADC_PIN_BASE = 200;

var CurrentSensor = function (adcChannel) {

    wpi.mcp3004Setup(ADC_PIN_BASE, 0);

    this.adcChannel = adcChannel;

    this.currentReadAdcZero = 0;
    this._readAdcZero();
};

CurrentSensor.prototype = {
    _readAdcZero: function () {
        var total = 0;
        var count = 1024;
        for (var i = 0; i < count; i++) {
            total += wpi.analogRead(ADC_PIN_BASE);
        }

        this.currentReadAdcZero = total * 1.0 / count;
        console.log(this.currentReadAdcZero);
    }
}

CurrentSensor.prototype.readCurrent = function() {

    var analogReadAmplitude = 0, min = this.currentReadAdcZero, max = this.currentReadAdcZero, filter = 4;
    var hz = 50;
    var sensitivity = 185; //185 mv/A

    var start = Date.now();
    do {
        var val = 0;
        for (var i = 0; i < filter; i++) {
            val += wpi.analogRead(ADC_PIN_BASE + this.adcChannel);
        }

        val = (val / filter);     // fine tuning of 0A AC reading! 512 = 0V
        if (max < val) max = val;
        if (val < min) min = val;

    } while (Date.now() - start <= 1100/hz);     //10% + to ensure p2p is acquired

    analogReadAmplitude = (max - min) / 2;

    // should be around 3300
    //var internalVcc = 1687*2;
    var internalVcc = (Math.round(this.currentReadAdcZero)/1024)*3300*2;

    // (analogReadAmplitude/2) * internalVcc / 1024               -> 0: 0               1024: 3300
    var sensedVoltage = (analogReadAmplitude * internalVcc) / (Math.round(this.currentReadAdcZero*2));//1024;

    var sensedCurrent = sensedVoltage / sensitivity;

    //var analogRead = wpi.analogRead(200 + channel);
    //mA = ((analogRead * (1687*2) / 1024) - 1687 ) / 187;

    return sensedCurrent;
};


module.exports = CurrentSensor;