function socket( $rootScope ) {
  var socketInstance = io( '/client' );

  return {
    on: function( channel, callback ){
      socketInstance.on( channel, function( data ) {
        $rootScope.$apply( callback( data ) );
      } );
    }
  }
}

socket.$inject = [ '$rootScope' ];

angular.module('rpiDoor').factory( 'socketService', socket );