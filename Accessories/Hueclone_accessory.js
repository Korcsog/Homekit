// MQTT Setup
var mqtt = require('mqtt');
console.log("Connecting to MQTT broker...");
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '192.168.1.42',
  clientId: 'HueTest'
};
var client = mqtt.connect(options);
console.log("Wifi Light Connected to MQTT broker");


var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

// here's a fake hardware device that we'll expose to HomeKit
var FAKELIGHT = {
  powerOn: false,
  brightness: 100, // percentage
  hue: 0,
  saturation: 0,

  setPowerOn: function(on) { 
    console.log("Turning Light %s!", on ? "on" : "off");

    if (on) {
      client.publish('hueclone', 'on');
      FAKELIGHT.powerOn = on;
   	} 
    else {
	    client.publish('hueclone','off');
      FAKELIGHT.powerOn = false;   
   };

  },
  setBrightness: function(brightness) {
    console.log("Setting light brightness to %s", brightness);
    client.publish('hueclone/brightness',String(brightness));
    FAKELIGHT.brightness = brightness;
  },
  setHue: function(hue){
    console.log("Setting light Hue to %s", hue);
    client.publish('hueclone/hue',String(hue));
    FAKELIGHT.hue = hue;
  },
  setSaturation: function(saturation){
    console.log("Setting light Saturation to %s", saturation);
    client.publish('hueclone/saturation',String(saturation));
    FAKELIGHT.saturation = saturation;
  },
  identify: function() {
    console.log("Identify the light!");
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "OFFICELIGHT".
var lightUUID = uuid.generate('hap-nodejs:accessories:HUECLONE');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory('Hue Clone', lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "AA:3C:ED:5A:1A:1A";
light.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
light
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Adafruit")
  .setCharacteristic(Characteristic.Model, "NeoPixel")
  .setCharacteristic(Characteristic.SerialNumber, "WS2812B-8pcs");

// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
  FAKELIGHT.identify();
  callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
  .addService(Service.Lightbulb, "Hue Clone") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    FAKELIGHT.setPowerOn(value);
    callback(); // Our fake Light is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    
    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.
    
    var err = null; // in case there were any problems
    
    if (FAKELIGHT.powerOn) {
      console.log("Are we on? Yes.");
      callback(err, true);
    }
    else {
      console.log("Are we on? No.");
      callback(err, false);
    }
  });

// also add an "optional" Characteristic for Brightness
light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('get', function(callback) {
    callback(null, FAKELIGHT.brightness);
  })
  .on('set', function(value, callback) {
    FAKELIGHT.setBrightness(value);
    callback();
  })

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('get',function(callback){
   callback(null,FAKELIGHT.hue);
   })
   .on('set',function(value,callback){
   FAKELIGHT.setHue(value);
   callback();   
   })

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('get',function(callback){
   callback(null,FAKELIGHT.saturation);
   })
   .on('set',function(value,callback){
   FAKELIGHT.setSaturation(value);
   callback();   
   })