var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var RoomHumidity = 0.0;

// MQTT Setup
var mqtt = require('mqtt');
console.log("Connecting to MQTT broker...");
var mqtt = require('mqtt');
var options = {
    port: 1883,
    host: '192.168.1.92',  //MQTT server IP address
    clientId: 'HAP_RoomHumiditySensor'
};
var client = mqtt.connect(options);
console.log("Humidity Sensor Connected to MQTT broker");
client.subscribe('RoomHumidity');
client.on('message', function(topic, message) {
    console.log(parseFloat(message));
    RoomHumidity = parseFloat(message);
});

// here's a fake humidity sensor device that we'll expose to HomeKit
var ROOM_HUMIDITY_SENSOR = {

  getHumidity: function() { 
    console.log("Getting the current Humidity!");
    return parseFloat(RoomHumidity); 
  },
  randomizeHumidity: function() {
    // randomize humidity to a value between 0 and 100
    ROOM_HUMIDITY_SENSOR.CurrentRelativeHumidity = parseFloat(RoomHumidity);;
  }
}

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var sensorUUID = uuid.generate('hap-nodejs:accessories:livingroom-humidity-sensor');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var sensor = exports.accessory = new Accessory('Livingroom Humidity Sensor', sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = "D2:5D:3A:AE:5E:F1";
sensor.pincode = "031-45-154";


sensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Kristof Korcsog") //additional  accessory information
  .setCharacteristic(Characteristic.Model, "DHT22") //additional  accessory information
  .setCharacteristic(Characteristic.SerialNumber, "000001"); //additional  accessory information

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
   .addService(Service.HumiditySensor, "Livingroom Humidity Sensor")
   .getCharacteristic(Characteristic.CurrentRelativeHumidity)
   .on('get', function (callback) {

        // return our current value
   callback(null, ROOM_HUMIDITY_SENSOR.getHumidity());
  });

// randomize our temperature reading every 10 seconds
setInterval(function() {
  
  ROOM_HUMIDITY_SENSOR.randomizeHumidity();

  // update the characteristic value so interested iOS devices can get notified
    sensor
        .getService(Service.HumiditySensor)
        .setCharacteristic(Characteristic.CurrentRelativeHumidity, ROOM_HUMIDITY_SENSOR.CurrentRelativeHumidity);

}, 10000);
