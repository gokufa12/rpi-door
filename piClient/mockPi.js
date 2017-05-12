var propParse = require('properties-parser');
var settings = propParse.read('./settings.conf');

process.openStdin().addListener("data", function(d) {
  inputHandler( d.toString().trim());
});

function inputHandler( input ) {
  if ( input === '0') {
    readInput( '', 0 )
  } else {
    readInput( '', 1 );
  }
}

//handle cleanup on various exits
require('./cleanup.js').Cleanup(cleanup);

var socket = require('socket.io-client')(`${settings.Server}:${settings.ServerPort}/rooms`);

var debug = process.env.DEBUG;
function debugLog(message) {
  if(debug) {
    console.log(message);
  }
}

socket.on('connect',function() {
  register();
});

var sensorPin = 16;
var ledPin = 11;
var randomRoomNumber = Math.floor( Math.random() * 4500 + 1);
var room = 'Room' + randomRoomNumber;

var interId;
//Listen for messages from server
socket.on('reserve', function(duration) {
  var dur = duration.duration;
  var elapsed = 0;

  interId = setInterval(function() {
    elapsed += 1000;
    if(elapsed > dur) {
      //stop interval, turn LED off
      clearInterval(interId);
    }
  }, 1000);
});

socket.on('overdue', function() {
});


//Function to register name, status with server
function register() {
  debugLog('connect');
  socket.emit('register',room);
  socket.emit('update', 'free');
}

//Read input, send necessary updates
function readInput(pin, value) {
  if(value) {
    socket.emit('update', 'free');
  } else {
    //Send update, stop flashing and interval if running
    socket.emit('update', 'occupied');
  }
  debugLog('The value is ' + value + ' on pin ' + pin);
}

//make sure to clean up gpio state
function cleanup() {
}
