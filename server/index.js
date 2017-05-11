var _ = require('lodash');

var express = require('express');
var socketIO = require('socket.io');
var path = require('path');

var PORT = process.env.PORT || 8000;

var app = express();

app.use(express.static(path.join(__dirname, '../dist')));
var server = app.listen(PORT, function() {
    console.log('Listening on port ' + PORT);
});

var io = socketIO(server);

var clientChannel = io.of('/client');

var pis = {
    one: {
        id: 'one',
        room: 'flex room 1',
        status: 'available'
    },
    two: {
        id: 'two',
        room: 'flex room 2',
        status: 'taken'
    }
};
var clientSockets = [];

clientChannel.on('connection', function(socket) {
    console.log('client connected');

    clientSockets.push(socket);
    socket.emit('initial-state', pis);

    socket.on('disconnect', function() {
        console.log('client disconnected');
        _.pull(clientSockets, socket);
    });
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

_.forEach(pis, function(pi) {
   var setStatus = function() {
        pi.status = pi.status === 'taken' ? 'available' : 'taken';
        clientChannel.emit('room-update', pi);
        setTimeout(setStatus, getRandomInt(2500, 10000))
    };
    setTimeout(setStatus, getRandomInt(2500, 10000))
});

setInterval( function() {
    clientChannel.emit('time', new Date().toTimeString())
}, 1000);