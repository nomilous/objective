
// start a repl server for this process if configured

var fs = require('fs');
var repl = require('repl');
var net = require('net');
var debug = require('debug');
var warn = objective.logger.warn;
var debug = objective.logger.createDebug('server');
var prompt = require('../globals/prompt');
var generate = require('shortid').generate;
var server, running;

module.exports.start = function(config) {

  if (running) return;

  running = true;

  objective.repls = {}

  if (typeof config.repl != 'object') return;

  if (typeof config.repl.listen != 'string') return;

  debug('starting repl server on ' + config.repl.listen);

  try {
    // remove existing socket at that location
    fs.unlinkSync(config.repl.listen);
  } catch(e) {}

  server = net.createServer(function(socket) {

    id = generate();
    objective.repls[id] = socket;
    objective.repls[id].grabbed = false;

    debug('socket connected, assigned id %s', id);

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
      delete objective.repls[id];
      debug('socket disconnected, id %s', id);
    })
    r.context.socket = socket;

    Object.defineProperty(r.context, 'grabPrompt',{
      get: function() {
        debug('socket grabbing prompt, id %s', id);
        var origEval = r.eval;
        var started = prompt.started; // prompt already running
        socket.cursorTo = function(n) {
          socket.write('_cursorTo_'+n+'_');
        };
        socket.clearLine = function() {
          socket.write('_clearLine_');
        };
        socket.reset = function() {

          debug('socket freeing prompt, id %s', id);
          require('debug').setStream();
          console._stdout = process.stdout;
          console._stderr = process.stderr;
          objective.repls[id].grabbed = false;

          // if (!started) {
          //   prompt.
          // }

          r.input = socket;
          r.output = socket;
          r.eval = origEval;
          input.write('\n');


        }
        if (started) {
          prompt.setStreams(socket, socket, false);
        } else {
          prompt.remoteStart(socket, socket);
        }
        r.output = require('dev-null')();
        //r.input = require('dev-null')();
        r.eval = function() {};
        process.nextTick(function(){
          prompt.writePrompt(false);
        });
        return 'got prompt';
      },
      enumerable: true,
      configurable: true
    });

    // 'grab' in the repl grabs the degug and console log streams

    Object.defineProperty(r.context, 'grab', {
      get: function() {
        debug('socket grabbing console streams, id %s', id);
        objective.repls[id].grabbed = true;
        require('debug').setStream(socket);
        console._stdout = socket;
        console._stderr = socket;
        return 'grabbed console streams';
      },
      enumerable: true,
      configurable: true
    });

    // 'free' in the repl releases the debug and console log streams

    Object.defineProperty(r.context, 'free', {
      get: function() {
        objective.repls[id].grabbed = false;
        require('debug').setStream();
        console._stdout = process.stdout;
        console._stderr = process.stderr;
        debug('socket freed console streams, id %s', id);
        return 'freed console streams';
      },
      enumerable: true,
      configurable: true
    });

  });

  server.listen(config.repl.listen);

  server.on('error', function(err) {
    warn('socket error on %s', config.repl.listen, err);
  });

  process.on('exit',function(){
    if (typeof config.repl.listen === 'string') {
      fs.unlinkSync(config.repl.listen);
    }
  })

}

module.exports.stop = function() {

}
