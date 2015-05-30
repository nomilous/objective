var debug = objective.logger.createDebug('child');

var pipeline = objective.pipeline;

var TODO = objective.logger.TODO;

var error = objective.logger.error;

var ref = require('when'), defer = ref.defer, promise = ref.promise;

var sequence = require('when/sequence');

var sep = require('path').sep;

var init = require('./init');

var deferrals = []    // accumulate array of promises as
                     // each concurrent child is called to load   

module.exports.nextDeferral = function() {

                  // loader wants access to .next

    if (deferrals.length == 0) return false;
    return deferrals.shift().promise;
}

pipeline.createEvent('objective.not.promised');
pipeline.createEvent('objective.init.error');
pipeline.createEvent('objective.run.error');
pipeline.createEvent('objective.empty');

module.exports.createLoader = function(root) {
  return promise(function(resolve, reject) {
    root.loadChild = function(filename) {
      debug('loading child %s into root %s', filename, root.config.title);

    }
    resolve();
  });
}









module.exports.load = function(config, callback) {

  var deferral, objectiveFile, objectiveFn;

  objective.roots = (objective.roots || []);
  objective.roots[0] = (objective.roots[0] || {children: {}});
  objective.roots[0].children = (objective.roots[0].children || {});
  TODO('insert into children unless there');

  deferrals.push(deferral = defer());

  init.user(config).then(function(){

    init.plugins(config)

  }).then(function(){

    debug('starting child objective with config', config);

    module.exports.run(config, objectiveFn, deferral);

  }).catch(deferral.reject)


  if (typeof callback == 'function') {

    debug('in callback()');

    objectiveFile = objective.getCallerFileName(4);

    objectiveFile = objectiveFile.replace(process.cwd() + sep, '');

    config.filename = objectiveFile;

    if (typeof config.uuid === 'undefined' || typeof config.uuid === null)

      config.uuid = objectiveFile

    objectiveFn = callback;

    if (typeof objective.currentChild !== 'undefined' && objective.currentChild !== null) {
      error('nested or multiple objectives per file not yet supported', objectiveFile);
      process.exit(1);
    }

    // this will change to point into children hash
    objective.currentChild = {config: config};

    return

  }

  return {

    run: function(fn) {

      debug('in run()');

      objectiveFile = objective.getCallerFileName(2);

      objectiveFile = objectiveFile.replace(process.cwd() + sep, '');

      config.filename = objectiveFile;

      if (typeof config.uuid === 'undefined' || typeof config.uuid === null)

        config.uuid = objectiveFile

      objectiveFn = fn;

      if (typeof objective.currentChild !== 'undefined' && objective.currentChild !== null) {
        error('nested or multiple objectives per file not yet supported', objectiveFile);
        process.exit(1);
      }

      objective.currentChild = {config: config};

    }
  }
};

module.exports.run = function(config, objectiveFn, deferral) {

  var required = {}, clearRequire;

  debug('child.run', config.title);

  // prepare list of already loaded modules to not be flushed
  // after the run

  for (filename in require.cache) required[filename] = {};

  clearRequire = function() {
    for (filename in require.cache) {
      if (typeof required[filename] !== 'undefined') continue;
      delete require.cache[filename];
      debug('Removed from require cache', filename);
    }
  };

  TODO('beforeAll, afterAll/Each for plugins');

  return sequence((function(){
    var pluginHooks = [];
    for (name in objective.plugins) {
      pluginHooks.push((function(name){
        return function(){
          return promise(function(resolve, reject){
            var plugin;
            
            debug('Running beforeEach in plugin "' + name + '"');

            plugin = objective.plugins[name];
            if (typeof plugin.$$beforeEach === 'function') {
              return plugin.$$beforeEach(config, function(err){
                if (typeof err !== 'undefined' && err !== null) {
                  error('Plugin "'+ name +'" beforeEach failed', err, err.stack);
                  return reject(err);
                }
                return resolve();
              })
            }
            return resolve();
          });
        };
      })(name));
    }
    return pluginHooks;

  })()).then(function() {
    var running;

    debug('Starting objective function.');

    if (objectiveFn.toString() === 'function () {}') {

      debug('Empty objective');

      return pipeline.emit('objective.empty',{
        config: config,
        deferral: deferral
      },
      function(){
        clearRequire();
        objective.currentChild = null;
        return deferral.resolve();
      });
    }

    try {
      TODO('get init err into objective if argline contains e');
      running = objective.injector({}, objectiveFn);
      if ((running != null) && (running.then != null) && typeof running.then === 'function') {

        debug('Got promise from objective function');

        running.then(function(res){
          objective.currentChild = null;
          clearRequire();
          return deferral.resolve(res);
        },function(err){
          objective.currentChild = null;
          clearRequire();
          return deferral.reject(err);
        },deferral.notify);

        if ((running.start != null) && typeof running.start === 'function') {
          running.start('child');
        }

      } else {

        debug('Got no promise from objective function');
        return pipeline.emit('objective.not.promised',{
          config: config,
          fn: objectiveFn,
          result: running,
          deferral: deferral
        },
        function(err){
          if (typeof err !== 'undefined' && err !== null) {
            clearRequire();
            objective.currentChild = null;
            return deferral.reject(err);
          }
          clearRequire();
          objective.currentChild = null;
          deferral.resolve();
        });
      }
    } catch (err) {

      debug('Error running objective');
      return pipeline.emit('objective.run.error',{
        config: config,
        fn: objectiveFn,
        error: err
      },
      function(err, payload) {
        // enables error swap - may change that.
        clearRequire();
        objective.currentChild = null;
        if (payload.error !== 'undefined' && payload.error != null)
          return deferral.reject(payload.error);
        return deferral.resolve(payload.result);
      });
    }
    
  }).catch(function(err){

    debug('Error initializing objective');
    pipeline.emit('objective.init.error',{
      config: config,
      fn: objectiveFn,
      error: err
    },function(err, payload){
      // enables error swap - may change that.
      objective.currentChild = null;
      TODO('objective gets err, or error if args');
      if (payload.error !== 'undefined' && payload.error != null)
        return deferral.reject(payload.error);
      return deferral.resolve(payload.result);
    });
    
    
  })

};
