function test( socketService ) {
  var vm = this;
  vm.rooms = {};

  socketService.on( 'initial-state', function( data ) {
    vm.rooms = data;
  } );

  socketService.on( 'room-update', function( data ) {
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
  }
}

test.$inject = [ 'socketService' ];

angular.module('rpiDoor')
  .component('rpiDoor', {
    templateUrl: 'UI/app.tpl.html',
    controller: test,
    controllerAs: '$ctrl'
  });