function test( socketService, $scope ) {
  var vm = this;
  vm.rooms = {};

  function formatServerDate(date) {
    return new Date(date).toLocaleTimeString();
  }

  socketService.on( 'initial-state', function( data ) {
    _.forEach(data, function(room) {
      room.displayStatus = room.status.charAt(0).toUpperCase() + room.status.slice(1);
      if (room.time) {
        room.time = formatServerDate(room.time);
      }
    });
    vm.rooms = data;
  } );

  //Converts a timeout in milliseconds to a formatted string <MM:SS>
  function formatCountdown(timeout) {
    var minutes = Math.floor(timeout / (60 * 1000));
    var seconds = Math.floor((timeout/1000) - minutes*60);

    var minuteString = '00';
    if(minutes < 10) minuteString = '0' + minutes.toString();
    else minuteString = minutes.toString();

    var secondString = '00';
    if(seconds < 10) secondString = '0' + seconds.toString();
    else secondString = seconds.toString();

    return minuteString + ':' + secondString;
  }

  socketService.on( 'room-update', function( data ) {
    data.displayStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    if (data.time) {
      data.time = formatServerDate(data.time);
    }

    var room = vm.rooms[ data.room ] = _.merge( vm.rooms[data.room], data );

    if (data.status === 'reserved') {
      //first, set the initial countdown string
      room.countdownString = formatCountdown(room.duration);
      var interval = 1000;
      //every <interval> milliseconds, recalculate the string
      room.coundownInterval = setInterval(function() {
        room.duration -= interval;
        if (room.duration < 0) {
          room.duration = 0;
          clearInterval(room.coundownInterval);
        }
        room.countdownString = formatCountdown(room.duration);
        $scope.$apply();
      }, interval);
    } else if (room.coundownInterval) {
      //If we are in any other state besides reserved, cancel the reserve interval
      clearInterval(room.coundownInterval);
    }
  } );

  socketService.on( 'room-disconnect', function( data ) {
    delete vm.rooms[ data.room ];
  } );

  vm.getClass = function( room ) {
    if ( room.status === 'overdue' ) {
      return 'danger';
    } else if ( room.status === 'occupied' ) {
      return 'primary';
    } else if( room.status === 'reserved') {
      return 'warning';
    }
    return 'success';
  };

  vm.reserveRoom = function( room ) {
    socketService.emit( 'reserve-room', room );
  }
}

test.$inject = [ 'socketService', '$scope' ];

angular.module('rpiDoor')
  .component('rpiDoor', {
    templateUrl: 'UI/app.tpl.html',
    controller: test,
    controllerAs: '$ctrl'
  });