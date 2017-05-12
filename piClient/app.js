var gpio = require('rpi-gpio');
var socket = require('socket.io-client')('http://localhost:8000/rooms', { 'force new connections' : true });
require('./cleanup.js').Cleanup(cleanup);

var debug = process.env.DEBUG;
function debugLog(message) {
  if(debug) {
    console.log(message);
  }
}

socket.on('reserve', function(duration) {
  var dur = duration.duration;
  var elapsed = 0;
  var flashOn = false;
  
  var interId = setInterval(function() {
    if(!flashOn) {
      write(11,true);
    } else {
      write(11,false);
    }
    flashOn = !flashOn;
    elapsed += 1000;
    if(elapsed > dur) {
      //stop interval, turn LED off
      clearInterval(interId);
      write(11,false);
    }
  }, 1000);


});


var room = 'Flex4403';

gpio.setMode(gpio.MODE_RPI);
gpio.on('change', readInput);

gpio.setup(11, gpio.DIR_OUT, function(err) {debugLog(err);});
gpio.setup(16, gpio.DIR_IN, gpio.EDGE_BOTH, function(err) {
  if(err) {
    debugLog(err);
  }
  if(socket.connected) {
    register();
  } else {
    socket.on('connect',function() {
      register();
    });
  }
});

function register() {
  debugLog('connect');
  socket.emit('register',room);
  gpio.read(16, function(err,value) {
    if(err) throw err;
    if(value) {
      console.log('free');
      socket.emit('update', 'free');
    } else {
      console.log('occupied');
      socket.emit('update', 'occupied');
    }
  });
}

function write(pin, high_low) {
  gpio.write(pin, high_low, function(err) {
    if (err) throw err;
    debugLog('Written ' + high_low + ' to pin ' + pin);
  });
}

function readInput(channel, value) {
    if(value) {
      socket.emit('update', 'free');
//      gpio.write(11, true, function(err) {
//        if(err) throw err;
//        debugLog('Written to pin');
//      });
    } else {
      socket.emit('update', 'occupied');
//      gpio.write(11, false, function(err) {
//        if(err) throw err;
//        debugLog('Written to pin');
//      });
    }
    debugLog('The value is ' + value + ' on channel ' + channel);
}

function cleanup() {
  gpio.destroy(function() {
    debugLog('Pins reset');
  });
}
