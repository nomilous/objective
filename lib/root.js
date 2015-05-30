var debug = objective.logger.createDebug('root');

var sep = require('path').sep;

var TODO = objective.logger.TODO;

var error = objective.logger.error;

var ref = require('when'), defer = ref.defer, promise = ref.promise;

var init = require('./init');

var recursor = require('./recursor');

var linker = require('./linker');

var child = require('./child');

var deferrals = [];

module.exports.nextDeferral = function() {
    if (deferrals.length == 0) return false;
    return deferrals.shift().promise;
}

module.exports.load = function(home, config, callback) {
  var deferral, objectiveFile, objectiveFn;

  objective.roots = (objective.roots || []);

  objective.roots.push(root = {});

  root.config = config;
  root.home = home;
  root.children = {};

  deferrals.push(deferral = defer());
  init.user(config)
  .then(function(){
    init.plugins(config);
  })
  .then(function(){
    recursor.create(root);
  })
  .then(function(){
    linker.create(root);
  })
  .then(function(){
    child.createLoader(root);
  })
  .then(function(){
    debug('starting root objective with config', config);
    module.exports.run(root, config, objectiveFn, deferral);
  })
  .catch(deferral.reject);

  if (typeof callback == 'function') {
    debug('in callback()');
    objectiveFile = objective.getCallerFileName(4);
    objectiveFile = objectiveFile.replace(process.cwd() + sep, '');
    config.filename = objectiveFile;
    objectiveFn = callback;
    return
  }

  return {
    run: function(fn) {
      debug('in run()');
      objectiveFile = objective.getCallerFileName(2);
      objectiveFile = objectiveFile.replace(process.cwd() + sep, '');
      config.filename = objectiveFile;
      objectiveFn = fn;
      return
    }
  }
}

module.exports.run = function(root, config, objectiveFn, deferral) {

  // root objective does not flush modules after run?

  // root objective does not run $$beforEach on plugins?

  var running;

  debug('Starting objective function.');
  if (objectiveFn.toString() === 'function () {}') {

    debug('Empty objective');

    return process.nextTick(function() {
      return deferral.resolve();
    });
  }

  try {

    TODO('get init err into objective if argline contains e');
    running = objective.injector({
      plugins: root.plugins,
      recurse: root.recursor,
      link: root.linker
    }, objectiveFn);
    if ((running != null) && (running.then != null) && typeof running.then === 'function') {

      debug('Got promise from objective function');
      running.then(deferral.resolve, deferral.reject, deferral.notify);
      if (typeof running.start === 'function') running.start('root');
      return
    }

    debug('Got no promise from objective function');
    return deferral.resolve();

  } catch(err) {
    return deferral.reject(err);
  }
}



