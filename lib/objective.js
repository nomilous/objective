// TODO - multiple requiring is problemattic, things are started over and over
//                                            eg. pipeline sigint listener
// TODO - Potentially unhandled rejection [2] Error: ... from root objectiveFn body

// var version = process.version.split(/\./)[1];
// if (version < 9) {
//   console.error('node version '+process.version+' too old.');
//   process.exit(1);
// }

function Objective() {
  var args = handleArgs(arguments);
  return Objective.run(args.config, args.callback);
};

Objective.getCaller = function(depth, cwdLess) {
  var e = new ObjectiveError();
  e.frames.shift();
  if (cwdLess) e.frames[depth].file = e.frames[depth].file.replace(process.cwd() + sep, '');
  return e.frames[depth]
}

Objective.argsOf = function(fn) {
  return fn.toString().match(/function\s*\((.*)\)/)[1]
    .replace(/\s/g, '').split(',').filter(function(arg) {
      if (arg !== '') return true;
  });
}

if (typeof objective == 'undefined') {
  Object.defineProperty(global, 'objective', {
    get: function() {
      return Objective;
    },
    configurable: false,
    enumerable: true
  });
}

module.exports = Objective;

                    require('./objective/error');
objective.logger  = require('./objective/logger');
objective.globals = require('./objective/globals');
objective.dev     = {reporters: require('../node_modules/objective_dev/lib/reporters')}
var debug         = objective.logger.createDebug('objective');
var TODO          = objective.logger.TODO;
var warn          = objective.logger.warn;
var error         = objective.logger.error;
var root          = require('./objective/root');
var child         = require('./objective/child');
var replServer    = require('./objective/repl/server');
var client        = require('./objective/repl/client');
var sep           = require('path').sep;
var dirname       = require('path').dirname;
var fs            = require('fs');
var program;

TODO('support nested or multiple objective per file (or prevent them');

if (typeof objective.rootWaiting == 'undefined') {
  Object.defineProperty(objective, 'rootWaiting', {
    get: function() {
      return root.nextDeferral();
    },
    configurable: false,
    enumerable: false
  });
}

if (typeof objective.childWaiting == 'undefined') {
  Object.defineProperty(objective, 'childWaiting', {
    get: function() {
      // when multiple child objectives are called to run
      // each has a promise - to enable running one at a time
      return child.nextDeferral();
    },
    configurable: true,
    enumerable: false
  });
}


Objective.run = function(config, callback) {

  debug('run', arguments);

  var filename = objective.getCaller(2).file;
  if (filename.match(new RegExp("objective_dev"+sep+"lib"+sep+"index.js"))) {
    filename = objective.getCaller(3).file;
  }
  var home, childsRoot;

  // load json config if present

  try {
    jsonConfig = JSON.parse(fs.readFileSync(filename + '.json').toString());
    var changes = Objective.merge(config, jsonConfig);
    debug('merged config json', jsonConfig);
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

  debug('config loaded');

  objective.roots = (objective.roots || []);

  if (typeof objective.loadAsRoot == 'undefined' || !objective.loadAsRoot || objective.loadingChildFrom) {
    if (objective.roots.length > 0 || objective.noRoot) {

      debug('loading child');

      if (objective.loadingChildFrom) {
        childsRoot = module.exports.findRoot({uuid:objective.loadingChildFrom});
        home = childsRoot.home;
        filename = filename.replace(home + sep, '');
      } else if (objective.roots.length >= 0) {
        console.log(objective.roots);
        error('re-implelemnt child loading blind');
        return;
      }

      config.filename = filename;
      return child.load(childsRoot, config, callback);

    }
  }

  if (program.attach) {
    debug('attaching to remote objective');
    client.connect(config);
    return {run:function(){}} // run nothing when --attach
  }

  debug('loading root');

  // use fullpath filename if no uuid on root

  config.uuid = (config.uuid || filename);

  // root has home

  home = dirname(filename);

  replServer.start(config);
  return root.load(home, config, callback);

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
      var pat = at;
      at = at[key];
      if (at) {
        if (last) {
          at = value;
          return
        }
      } else {
        if (last) {
          pat[key] = value;
        } else {
          at = pat[key] = {}
        }
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
    var value1 = getValueAt(config1, path);
    var value2 = getValueAt(config2, path);

    if (typeof value1 === 'undefined') {
      // apply value from config2 to config1
      setValueAt(config1, path, value2)
    } else {
      if (value1 instanceof Array || value2 instanceof Array) {
        // console.log('array');
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

program = require('./objective/program');
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