var propParse = require('properties-parser');
var settings = propParse.read('./settings.conf');
var gpio = require('rpi-gpio');

//handle cleanup on various exits
require('./cleanup.js').Cleanup(cleanup);

var socket = require('socket.io-client')(`${settings.Server}:${settings.ServerPort}/rooms`);

var debug = process.env.DEBUG;
function debugLog(message) {
  if(debug) {
    console.log(message);
  }
}

var sensorPin = 16;
var ledPin = 11;
var room = settings.RoomName;
var loc = settings.Location;

var interId;
//Listen for messages from server
socket.on('reserve', function(duration) {
  var dur = duration.duration;
  var elapsed = 0;
  var flashOn = false;
  
  interId = setInterval(function() {
    if(!flashOn) {
      write(ledPin,true);
    } else {
      write(ledPin,false);
    }
    flashOn = !flashOn;
    elapsed += 1000;
    if(elapsed > dur) {
      //stop interval, turn LED off
      clearInterval(interId);
      write(ledPin,false);
    }
  }, 1000);
});

socket.on('overdue', function() {
  var flashOn = false;

  interId = setInterval(function() {
    gpio.read(sensorPin, function(err,value) {
      if(value) {
        //stop interval, turn LED off
        clearInterval(interId);
        write(ledPin,false);
        return;
      }

      if(!flashOn) {
        write(ledPin,true);
      } else {
        write(ledPin,false);
      }
      flashOn = !flashOn;
    });
  }, 200);
});

//Set up GPIO
gpio.setMode(gpio.MODE_RPI);
//On changes, we will read the input and send an update
gpio.on('change', readInput);

gpio.setup(ledPin, gpio.DIR_OUT, function(err) {debugLog(err);});
gpio.setup(sensorPin, gpio.DIR_IN, gpio.EDGE_BOTH, function(err) {
  if(err) {
    debugLog(err);
  }
  //register status with server
  if(socket.connected) {
    register();
  } else {
    socket.on('connect',function() {
      register();
    });
  }
});

//Function to register name, status with server
function register() {
  debugLog('connect');
  socket.emit('register',{'room':room, 'loc':loc});
  gpio.read(sensorPin, function(err,value) {
    if(err) throw err;
    if(value) {
      console.log('free');
      socket.emit('update', 'free');
    } else {
      console.log('occupied');
      socket.emit('update', 'occupied');
      write(ledPin,true);
    }
  });
}

//Write high or low to pin
function write(pin, high_low) {
  gpio.write(pin, high_low, function(err) {
    if (err) throw err;
    debugLog('Written ' + high_low + ' to pin ' + pin);
  });
}

//Read input, send necessary updates
function readInput(pin, value) {
    if(value) {
      socket.emit('update', 'free');
      write(ledPin,false);
    } else {
      //Send update, stop flashing and interval if running
      socket.emit('update', 'occupied');
      clearInterval(interId);
      write(ledPin,false);
    }
    debugLog('The value is ' + value + ' on pin ' + pin);
}

//make sure to clean up gpio state
function cleanup() {
  gpio.destroy(function() {
    debugLog('Pins reset');
  });
}
