
// start a repl server for this process if configured

var fs = require('fs');
var repl = require('repl');
var net = require('net');
var debug = require('debug');
var warn = objective.logger.warn;
var debug = objective.logger.createDebug('server');
var server;

module.exports.start = function(config) {

  if (typeof config.repl != 'object') return;

  if (typeof config.repl.listen != 'string') return;

  debug('repl server on ' + config.repl.listen);

  try {
    // remove existing socket at that location
    fs.unlinkSync(config.repl.listen);
  } catch(e) {}

  server = net.createServer(function(socket) {

    warn('repl attached at ' + config.repl.listen);

    var r = repl.start({
      prompt: config.title + '> ',
      input: socket,
      output: socket,
      terminal: true,
      useGlobal: true
    })
    r.on('exit', function() {
      socket.end();
      require('debug').setStream();
      console._stdout = process.stdout;
      console._stderr = process.stderr;
      warn('repl detached at ' + config.repl.listen);
    })
    r.context.socket = socket;

    // 'grab()' in the repl grabs the degug log stream

    r.context.grab = function() {
      require('debug').setStream(socket);
      console._stdout = socket;
      console._stderr = socket;
      return 'grabbed logger stream'
    };

    // 'free()' in the repl releases the debug logstream

    r.context.free = function() {
        require('debug').setStream();
        console._stdout = process.stdout;
        console._stderr = process.stderr;
        return 'freed logger stream'
    };

  });

  server.listen(config.repl.listen);

  process.on('exit',function(){
    if (typeof config.repl.listen === 'string') {
      fs.unlinkSync(config.repl.listen);
    }
  })

}

module.exports.stop = function() {

}
