version = process.version.split(/\./)[1];
if (version < 9) {
  console.error('node version '+process.version+' too old.');
  process.exit(1);
}

function Objective() {
  var args = handleArgs(arguments);
  return Objective.run(args.config, args.callback);
};

Objective.getCallerFileName = function(depth, location) {
  location = (location || {});
  origPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) { return stack; }
  stack = (new Error()).stack;
  Error.prepareStackTrace = origPrepareStackTrace;
  location.lineNumber = stack[depth].getLineNumber()
  location.columnNumber = stack[depth].getColumnNumber()
  return stack[depth].getFileName()
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
var warn     = objective.logger.warn;
var error    = objective.logger.error;
var root     = require('./root');
var child    = require('./child');
var repl     = require('./repl/server');
var client   = require('./repl/client');
var sep      = require('path').sep;
var dirname  = require('path').dirname;
var fs       = require('fs');
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

Objective.run = function(config, callback) {

  var filename = objective.getCallerFileName(3);

  // load json config if present

  try {
    jsonConfig = JSON.parse(fs.readFileSync(filename + '.json').toString());
    var changes = Objective.merge(config, jsonConfig);
    for (var key in changes) {
      warn('objective config clash with json for %s, keeping \'%s\' from objective', key, changes[key].now);
    }
  } catch(e) {
    if (e.code != 'ENOENT') {
      error('error parsing json config %s', filename + '.json');
      console.log(e);
      process.exit(1);
    }
  }



  objective.roots = (objective.roots || []);

            // gap to support multiple roots later

  if (objective.roots.length > 0 || objective.noRoot) {

    // already got a root objective, or running no root
    // handle child objective...

    
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

  // use fullpath filename if no uuid on root

  config.uuid = (config.uuid || filename);

  // root has home

  config.home = dirname(filename);

  repl.start(config);
  return root.load(config, callback);

};

Objective.findRoot = function(search) {
  var found;
  objective.roots.forEach(function(root) {
    if (root.config.uuid == search.uuid) found = root;
  });
  return found;
}

Objective.merge = function(config1, config2) {
  // config2 values are merged into config1 one
  // where vlues differ, config1 wins
  // returns report on changes
  var changes = {};

  var getValueAt = function(object, path) {
    try {
      var at = object;
      path.forEach(function(key) {
        at = at[key];
      });
      return at;
    } catch(e) {
      return void 0;
    }
  }

  var setValueAt = function(object, path, value) {
    var at = object;
    var count = 0
    path.forEach(function(key) {
      var last = path.length == ++count
      if (at[key] !== 'undefined') {
        if (typeof at[key] === 'object') {
          at = at[key];
        }
        if (last) {
          at[key] = value;
          return
        }
      }
      // overwrites non object or undefined along path
      if (last) {
        at[key] = value;
        return;
      } else {
        at[key] = {};
        at = at[key];
      }
    });
  }

  var recurse = function(node, path) {
    if (!path) path = [];
    if (typeof node === 'object' && ! (node instanceof Array)) {
      for (var key in node) {
        path.push(key);
        recurse(node[key], path)
        path.pop();
      }
      return;
    }
    value1 = getValueAt(config1, path);
    value2 = getValueAt(config2, path);
    if (typeof value1 === 'undefined') {
      // apply value from config2 to config1
      setValueAt(config1, path, value2)
    } else {
      if (value1 instanceof Array || value2 instanceof Array) {
        console.log('array');
        changes[path.join('.')] = {
          was: value2.toString(),
          now: value1.toString()
        }
      }
      else if (value1 != value2) {
        changes[path.join('.')] = {
          // config1 overrides config2 in args
          was: value2,
          now: value1
        }
      }
    }
  }
  recurse(config2);
  return changes;
}


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
    } else {
      config = title;
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