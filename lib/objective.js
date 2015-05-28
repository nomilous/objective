version = process.version.split(/\./)[1];
if (version < 9) {
  console.error('node version '+process.version+' too old.');
  process.exit(1);
}

function Objective() {

  var args = handleArgs(arguments);
  return Objective.run(args.config, args.callback);

};


// console.log = function(msg) {
//   process.stdout.write((new Error(msg)).stack + '\n\n');
// }


// objective onto global as property

Object.defineProperty(global, 'objective', {
  get: function() {
    return Objective;
  },
  configurable: false,
  enumerable: false
});

module.exports = Objective;

objective.logger = require('./logger');
objective.globals = require('./globals');

var debug    = objective.logger.createDebug('objective');
var TODO     = objective.logger.TODO;
var error    = objective.logger.error;
var root     = require('./root');
var child    = require('./child');
var repl     = require('./repl/server');
var client   = require('./repl/client');
var sep      = require('path').sep;
var program;

Object.defineProperty(objective, 'rootWaiting', {
  get: function() {
    // usually only one
    return root.nextDeferral();
  },
  configurable: false,
  enumerable: false
});

Object.defineProperty(objective, 'childWaiting', {
  get: function() {
    // when multiple child objectives are called to run
    // each has a promise - to enable running one at a time
    return child.nextDeferral();
  },
  configurable: false,
  enumerable: false
});

Objective.getCallerFileName = function(depth) {

  origPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) { return stack; }
  stack = (new Error()).stack;
  Error.prepareStackTrace = origPrepareStackTrace;
  return stack[depth].getFileName()

};

Objective.run = function(config, callback) {

  objective.roots = (objective.roots || []);

            // gap to support multiple roots later

  var filename;

  if (objective.roots.length > 0 || objective.noRoot) {

    // already got a root objective, or running no root
    // handle child objective...

    filename = objective.getCallerFileName(3);
    filename = filename.replace(process.cwd() + sep, '');
    try {
      if (filename == objective.roots[0].config.filename) {
        error('nested or multiple objectives per file not yet supported', filename);
        process.exit(1); //bang!
      }
    } catch(e) {}
    return child.load(config, callback);
  }

  if (program.attach) {
    client.connect(config);
    return {run:function(){}} // run nothing when --attach
  }

  repl.start(config);
  return root.load(config, callback);

};


// run the command line

program = require('./program');
program.start()
objective.program = program;

function handleArgs(args) {

  // a running objective, arguments behave dynamically
  // organise them...

  var title = args[0];
  var config = args[1];
  var callback = args[2];

  if (typeof title === 'string') {
    if (typeof config === 'object') {
      config.title = title;
    }
    else if (typeof config === 'undefined' || config === null) {
      config = {title: title};
    }
    else if (typeof config === 'function') {
      callback = config;
      config = {title: title};
    }
  }
  if (typeof title === 'object') {
    if (typeof config === 'function') {
      config = title;
      callback = config;
    }
  }
  if (typeof title === 'function') {
    callback = title;
    config = {}
  }
  if (typeof title === 'undefined' || title === null) {
    config = {title: 'Untitled Objective'};
  }
  if (typeof config.title === "undefined" || config.title === null) {
    config.title = 'Untitled Objective'
  }

  return {
    config: config,
    callback: callback
  }

}