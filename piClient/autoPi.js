var propParse = require('properties-parser');
var settings = propParse.read('./settings.conf');

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
var locs = ['Washington, D.C.', 'New York City', 'London', 'Chicago'];
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
	if(Math.random() > .99) { //occupy the room 1% of the time
	  socket.emit('update', 'occupied');
	  clearInterval(interId);
	}
  }, 1000);
});

socket.on('overdue', function() {
});


//Function to register name, status with server
function register() {
  debugLog('connect');

  socket.emit('register', {
    room: room,
    loc: locs[Math.floor(Math.random()*locs.length)]
  });
  socket.emit('update', 'free');
}

function flipLoop() {
	setInterval(function() {
	  if(value) {
        socket.emit('update', 'free');
      } else {
        //Send update, stop flashing and interval if running
        socket.emit('update', 'occupied');
        clearInterval(interId);
      }
	  value = !value;
	}, sleepTime * 60000);
}

var sleepTime = process.argv[2] || 5;
var value = false;
debugLog(sleepTime * 60000);

flipLoop();

//make sure to clean up gpio state
function cleanup() {
}
