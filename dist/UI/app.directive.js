function test( socketService ) {
  var vm = this;
  vm.rooms = {};

  function formatServerDate(date) {
    return new Date(date).toLocaleTimeString();
  }

  socketService.on( 'initial-state', function( data ) {
    _.forEach(data, function(room) {
      if (room.time) {
        room.time = formatServerDate(room.time);
      }
    });
    vm.rooms = data;
  } );

  socketService.on( 'room-update', function( data ) {
    if (data.time) {
      data.time = formatServerDate(data.time);
    }
    vm.rooms[ data.room ] = _.merge( vm.rooms[data.room], data );
  } );

  socketService.on( 'room-disconnect', function( data ) {
    delete vm.rooms[ data.room ];
  } );

  vm.getClass = function( room ) {
    if ( room.status === 'overdue' ) {
      return 'danger';
    } else if ( room.status === 'occupied' ) {
      return 'warning';
    }
    return 'success';
  };

  vm.reserveRoom = function( room ) {
    socketService.emit( 'reserve-room', room );
  }
}

test.$inject = [ 'socketService' ];

angular.module('rpiDoor')
  .component('rpiDoor', {
    templateUrl: 'UI/app.tpl.html',
    controller: test,
    controllerAs: '$ctrl'
  });