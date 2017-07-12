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

var pis = {};

clientChannel.on('connection', function(socket) {
    log('client connected');

    socket.emit('initial-state', _.transform( pis, function(acc, room, key) {
        acc[key] = _.pick(room, ['room', 'loc', 'status', 'time']);
    }, {}));

    socket.on('disconnect', function() {
        log('client disconnected');
    });

    socket.on('reserve-room', function(data) {
        if ( !_.isUndefined( _.get( pis, [ data.room, 'socket' ] ) ) ) {
            roomReserve(pis[ data.room ].socket);
        } else {
            clientChannel.emit('room-update', {
                room: data.room,
                status: 'reserved',
                duration: reserveTimeout
            })
        }
    });
});

function roomFree(socket) {
    if (socket.timeout) {
        clearTimeout(socket.timeout);
        socket.timeout = undefined;
    }
    log(socket.room + ' - New Status: free');
    socket.time = null;

    pis[ socket.room ] = _.merge( pis[ socket.room ], {
        room: socket.room,
        status: 'free',
        time: socket.time
    });

    clientChannel.emit('room-update', {
        room: socket.room,
        loc: socket.loc,
        status: 'free',
        time: socket.time
    });
}
var reserveTimeout = 30 * 1000; //30 second time to get to room
function roomReserve(socket) {
    if (socket.reservedTimeout) {
        clearTimeout(socket.reservedTimeout);
        socket.reservedTimeout = undefined;
    }
    if (socket.timeout) {
        clearTimeout(socket.timeout);
        socket.timeout = undefined;
    }

    socket.reservedTimeout = setTimeout( function() {
        socket.time = null;
        pis[ socket.room ] = _.merge( pis[ socket.room ], {
            room: socket.room,
            status: 'free',
            time: socket.time
        });
        clientChannel.emit('room-update', {
            room: socket.room,
            loc: socket.loc,
            status: 'free',
            time: socket.time
        });
    }, reserveTimeout);

    socket.emit('reserve', {
        duration: reserveTimeout
    });

    pis[ socket.room ] = _.merge( pis[ socket.room ], {
        room: socket.room,
        status: 'reserved',
    });

    clientChannel.emit('room-update', {
        room: socket.room,
        loc: socket.loc,
        status: 'reserved',
        duration: reserveTimeout
    });

}

var overdueTimeout = 10 * 60000; //10 minute overdue timeout
function roomOccupied(socket) {
    if (socket.reservedTimeout) {
        clearTimeout(socket.reservedTimeout);
        socket.reservedTimeout = undefined;
    }

    if (socket.timeout) {
        clearTimeout(socket.timeout);
        socket.timeout = undefined;
    }
    socket.timeout = setTimeout(function() {
        socket.emit('overdue');
        log(socket.room + ' - New Status: overdue');

        pis[ socket.room ] = _.merge( pis[ socket.room ], {
            room: socket.room,
            status: 'overdue',
            time: socket.time
        });

        clientChannel.emit('room-update', {
            room: socket.room,
            loc: socket.loc,
            status: 'overdue',
            time: socket.time
        });
    }, overdueTimeout);
    log(socket.room + ' - New Status: occupied');
    socket.time = new Date();

    pis[ socket.room ] = _.merge( pis[ socket.room ], {
        room: socket.room,
        status: 'occupied',
        time: socket.time
    });

    clientChannel.emit('room-update', {
        room: socket.room,
        loc: socket.loc,
        status: 'occupied',
        time: socket.time
    });
}

roomChannel.on('connection', function(socket) {
    log('PI CONNECTED!!!!!');

    socket.on('register', function(data) {
        log(data.room + ' registered!');
        socket.room = data.room;
        socket.loc = data.loc;
        pis[data.room] = {
            room: data.room,
            loc: data.loc,
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
        if (socket.state === state) {
            log('Encountered duplicate state, ignoring');
            return;
        }
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
