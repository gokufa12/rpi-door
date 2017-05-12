var _ = require('lodash');
var debugMode = process.env.DEBUG;
function log(string) {
    if(debugMode) {
        console.log(string);
    }
}

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
var roomChannel = io.of('/rooms');

var pis = {
    Room1: {
        room: 'Room1',
        status: 'free',
        time: null
    },
    Room2: {
        room: 'Room2',
        status: 'occupied',
        time: new Date()
    }
};

clientChannel.on('connection', function(socket) {
    log('client connected');

    socket.emit('initial-state', _.transform( pis, function(acc, room, key) {
        acc[key] = _.pick(room, ['room', 'status', 'time']);
    }, {}));

    socket.on('disconnect', function() {
        log('client disconnected');
    });

    socket.on('reserve-room', function(data) {
        if ( !_.isUndefined( _.get( pis, [ data.room, 'socket' ] ) ) ) {
            roomReserve(pis[ data.room ].socket);
        }
    });
});


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

_.forEach(pis, function(pi) {
   var setStatus = function() {
       if (pi.status === 'free') {
           pi.status = 'occupied';
           pi.time = new Date();
       } else if ( pi.status === 'occupied' ) {
           pi.status = 'overdue';
       } else {
           pi.status = 'free';
           pi.time = null;
       }
       log(pi.room + ' - New Status: ' + pi.status);
       clientChannel.emit('room-update', pi );
       setTimeout(setStatus, getRandomInt(2500, 10000))
    };
    setTimeout(setStatus, getRandomInt(2500, 10000))
});

function roomFree(socket) {
    if (socket.timeout) {
        clearTimeout(socket.timeout);
        socket.timeout = undefined;
    }
    log(socket.room + ' - New Status: free');
    clientChannel.emit('room-update', {
        room: socket.room,
        status: 'free'
    });
}
var reserveTimeout = 5000;
function roomReserve(socket) {
    socket.reservedTimeout = setTimeout( function() {
        clientChannel.emit('room-update', {
            room: socket.room,
            status: 'free'
        });
    }, reserveTimeout);
    socket.emit('reserve', {
        duration: reserveTimeout
    });
    clientChannel.emit('room-update', {
        room: socket.room,
        status: 'reserved'
    });

}

var overdueTimeout = 10 * 1000;
function roomOccupied(socket) {
    if (socket.reservedTimeout) {
        clearTimeout(socket.reservedTimeout);
        socket.reservedTimeout = undefined;
    }
    socket.timeout = setTimeout(function() {
        socket.emit('overdue');
        log(socket.room + ' - New Status: overdue');
        clientChannel.emit('room-update', {
            room: socket.room,
            status: 'overdue'
        });
    }, overdueTimeout);
    log(socket.room + ' - New Status: occupied');
    clientChannel.emit('room-update', {
        room: socket.room,
        status: 'occupied'
    });
}

roomChannel.on('connection', function(socket) {
    log('PI CONNECTED!!!!!');

    socket.on('register', function(room) {
        log(room + ' registered!');
        socket.room = room;
        pis[room] = {
            room: room,
            status: 'unknown',
            socket: socket
        }
    });

    socket.on('disconnect', function() {
        log(socket.room + ' Disconnected');

        if (socket.timeout) {
            clearTimeout(socket.timeout);
        }
        if (socket.reservedTimeout) {
            clearTimeout(socket.reservedTimeout);
        }
        delete pis[socket.room];
        clientChannel.emit('room-disconnect', {
            room: socket.room
        });
    });

    socket.on('update', function(state) {
        log(state);
        switch(state) {
            case 'free':
                roomFree(socket);
                break;
            case 'occupied':
                roomOccupied(socket);
                break;
        }
    });
});
