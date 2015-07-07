var debug = objective.logger.createDebug('root');

var sep = require('path').sep;

var TODO = objective.logger.TODO;

var error = objective.logger.error;

var ref = require('when'), defer = ref.defer, promise = ref.promise;

var init = require('./init');

var recursor = require('./recursor');

var linker = require('./linker');

var child = require('./child');

var fs = require('fs');

var deferrals = [];

module.exports.nextDeferral = function() {
    if (deferrals.length == 0) return false;
    return deferrals.shift().promise;
}

module.exports.load = function(home, config, callback) {
  var root, deferral, objectiveFile, objectiveFn, run;

  objective.roots = (objective.roots || []);

  objective.roots.push(root = {});

  root.config = config;
  root.home = home;
  root.children = {};

  try {
    root.config.package = JSON.parse(
      fs.readFileSync(home + sep + 'package.json').toString()
    );
  } catch(e) {}

  deferrals.push(deferral = defer());
  init.user(config)
  .then(function(){
    return recursor.create(root);
  })
  .then(function(){
    return linker.create(root);
  })
  .then(function(){
    return child.createLoader(root);
  })
  .then(function(){
    return init.plugins(config);
  })
  .then(function(){
    debug('starting root objective with config', config);
    return module.exports.run(root, config, objectiveFn, deferral);
  })
  .catch(function(err){
    error('initialization error', err);
    deferral.reject(err);
    process.exit(1); //? 
  });

  run = function(disp, depth, fn) {
    debug(disp);
    objectiveFile = objective.getCaller(depth, true).file;
    config.filename = objectiveFile;
    objectiveFn = fn;
  }

  if (typeof callback == 'function') 
    return run('in callback()', 5, callback);

  return {
    run: function(fn) {
      run('in run()', 2, fn);
    }
  }
}

module.exports.run = function(root, config, objectiveFn, deferral) {

  var running;

  debug('Starting objective function.');

  try {

    TODO('get init err into objective if argline contains e');

    running = objective.injector({
      root: root,
      config: config,
      fn: objectiveFn,
      plugins: root.plugins,
      recurse: root.recursor,
      require: objective.require,
      link: root.linker,
      moduleInjectFrom: root.home,
      // ignoreInjectError: true,
      redirectInjectError: true
    }, objectiveFn);

    deferral.notify({event: 'starting', root: root}); // may still fail

    if ((running != null) && (running.then != null) && typeof running.then === 'function') {

      debug('Got promise from objective function');
      running.then(
        function() {
          deferral.resolve();
        },
        function(e) {
          deferral.reject(e);
        }, 
        deferral.notify
      );
      if (typeof running.start === 'function') running.start('root');
      return
    }

    debug('Got no promise from objective function');
    return deferral.resolve();

  } catch(err) {
    console.log(err)
    return deferral.reject(err);
  }
}



