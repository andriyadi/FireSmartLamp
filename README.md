# FireSmartLamp
It's a Firebase showcase that shows how we can leverage Firebase as the backend of IoT device. 
In this case, I create a Smart Lamp using Raspberry Pi 2. Thanks to Firebase, it's controllable over the internet. 


All I have to do next is creating a web or mobile app, to change some values in Firebase database, 
and that change will be propagated to and processed by IoT device to do some actions.


I use this demo to talk about Firebase in 2 GDG DevFest events, in [Jakarta](https://sites.google.com/a/kibar.co.id/devfest-indonesia-2015/program/jakarta)
(Oct 17) and [Surabaya](https://sites.google.com/a/kibar.co.id/devfest-indonesia-2015/program/surabaya) (Oct 18).


##Background
My team in [DyCode](http://dycode.co.id) and I have been using Firebase since early 2014 in several products and projects. So, I know a bit about Firebase :)
Most of the Firebase usecases we did so far are for chat app and for data synchronization across related apps. 
Samples and talks around Firebase are around mobile and web apps, but I haven't see one that's related to IoT. 
As my recent passion is around IoT, why not creating Firebase usecase for IoT, right? :)


Granted, for IoT, especially the one that requires more low level programming like Arduino and other MCUs, 
there're already de-facto protocols and SDKs, such as: MQTT and CoAP. I just wanna do something different with IoT and Firebase.
As you can see in the code, it's super easy to get started (hey, I don't say MQTT is hard though). 
Your knowledge around Firebase is fully usable in this IoT scenario.


##Components

To properly deploy the project, you need to prepare following components:

* Raspberry Pi 2 with Raspbian OS. Node.js runtime should be installed.
* Solid state AC switch circuit (will detail it later)
* AC light bulb
* AC current sensor ACS712 5A
* Analog to Digital Converter IC MCP3008
* Voltage divider circuit to convert 5 volts to 3.3 volts. Output from ACS712 is 5 volts, while Raspberry Pi expects 3.3 volts.
* Light-dependent Resistor (LDR) and voltage-divider resistor


