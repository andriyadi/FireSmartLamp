// Copyright (c) DycodeX. All rights reserved.
// Author: Andri Yadi

'use strict';

var wpi = require('wiring-pi');

var Switch = function (gpioPinNo) {

    wpi.setup('gpio');
    wpi.pinMode(gpioPinNo, wpi.OUTPUT);

    this.switchGpioPin = gpioPinNo;
    this.currentGpioValue = 0;
    wpi.digitalWrite(this.switchGpioPin, this.currentGpioValue);
};

Switch.prototype.isOn = function () {
    return (this.currentGpioValue == 1);
}

Switch.prototype.switchOn = function () {
    this.currentGpioValue = 1;
    wpi.digitalWrite(this.switchGpioPin, this.currentGpioValue);
};

Switch.prototype.switchOff = function () {
    this.currentGpioValue = 0;
    wpi.digitalWrite(this.switchGpioPin, this.currentGpioValue);
};

Switch.prototype.toggle = function () {
    if (this.currentGpioValue == 1) {
        this.switchOff();
    } else {
        this.switchOn();
    }
};

module.exports = Switch;
