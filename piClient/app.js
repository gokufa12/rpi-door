var gpio = require('rpi-gpio');
//var socket = require('socket.io-client')('http://localhost:8000/rooms');
//require('./cleanup.js').Cleanup(cleanup);

var room = 'Flex4403';

//socket.on('connect',function() {
//  console.log('connect');
//  socket.emit('register',room);
//});

gpio.setMode(gpio.MODE_BCM);
gpio.on('change', readInput);

//setInterval(function() {
//  gpio.read(23,function(err, val) {
//    console.log(val);
//  });
//}, 1000);

gpio.setup(23, gpio.DIR_IN, gpio.EDGE_BOTH, function(err) {
  console.log(err);
  });
//gpio.setup(11, gpio.DIR_HIGH, write);

//function write(err) {
//  if(err) throw err;
//  gpio.write(11, false, function(err) {
//    if (err) throw err;
//    console.log('Written to pin');
//  });
//}

function readInput(channel, value) {
//    if(channel !== 23)
//      return;
//    if(value) {
//      socket.emit('update', 'occupied');
//      gpio.write(11, true, function(err) {
//        if(err) throw err;
//        console.log('Written to pin');
//      });
//    } else {
//      socket.emit('update', 'free');
//      gpio.write(11, false, function(err) {
//        if(err) throw err;
//        console.log('Written to pin');
//      });
//    }
    console.log('The value is ' + value + ' on channel ' + channel);
}

function cleanup() {
  gpio.destroy(function() {
    console.log('Pins reset');
  });
}

//cleanup();
//process.exit(2);
