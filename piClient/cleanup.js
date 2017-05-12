function nop() {};

exports.Cleanup = function Cleanup(callback) {

  callback = callback || nop;
  
  process.on('cleanup', callback);

  process.on('exit',function() {
    process.emit('cleanup');
  });

  process.on('SIGINT', function() {
    //exit normally, will call cleanup
    console.log('Ctrl-C');
    process.exit(2);
  });

  process.on('uncaughtException', function(e) {
    console.log('Uncaught exception...');
    console.log(e.stack);
    process.exit(99);
  });
}
