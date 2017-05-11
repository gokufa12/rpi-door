function test(socketService) {
  var vm = this;
  vm.time = '';
  vm.data = {};

  socketService.on('time', function(timeString) {
    vm.time = timeString;
  } );

  socketService.on( 'initial-state', function( data ) {
    vm.data = data;
  } );

  socketService.on( 'room-update', function( data ) {
    vm.data[ data.id ] = _.merge( vm.data[ data.id ], data );;
  } );
}

test.$inject = [ 'socketService' ];

angular.module('rpiDoor')
  .component('test', {
    templateUrl: 'UI/test.tpl.html',
    controller: test,
    controllerAs: '$ctrl'
  });