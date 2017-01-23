var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var RoomTemperature = 0.0;

// MQTT Setup
var mqtt = require('mqtt');
console.log("Connecting to MQTT broker...");
var mqtt = require('mqtt');
var options = {
    port: 1883,
    host: '192.168.1.92',
    clientId: 'HAP_RoomTemperatureSensor'
};
var client = mqtt.connect(options);
console.log("Temperature Sensor Connected to MQTT broker");
client.subscribe('RoomTemperature');
client.on('message', function(topic, message) {
   console.log(parseFloat(message));
   RoomTemperature = parseFloat(message);
});

// here's a fake temperature sensor device that we'll expose to HomeKit
var ROOM_TEMP_SENSOR = {

  getTemperature: function() { 
    console.log("Getting the current temperature!");
    return parseFloat(RoomTemperature); 
  },
  randomizeTemperature: function() {
    // randomize temperature to a value between 0 and 100
    ROOM_TEMP_SENSOR.currentTemperature = parseFloat(RoomTemperature);;
  }
}

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var sensorUUID = uuid.generate('hap-nodejs:accessories:livingroom-temp-sensor');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var sensor = exports.accessory = new Accessory('Livingroom Temp Sensor', sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = "D2:5D:3A:AE:5E:F2";
sensor.pincode = "031-45-154";

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
  .addService(Service.TemperatureSensor, "Livingroom Temp Sensor")
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    
    // return our current value
    callback(null, ROOM_TEMP_SENSOR.getTemperature());
  });

// randomize our temperature reading every 10 seconds
setInterval(function() {
  
  ROOM_TEMP_SENSOR.randomizeTemperature();
  
  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, ROOM_TEMP_SENSOR.currentTemperature);
  
}, 10000);
