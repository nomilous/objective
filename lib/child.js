var debug = objective.logger.createDebug('child');

var pipeline = objective.pipeline;

var TODO = objective.logger.TODO;

var warn = objective.logger.warn;

var error = objective.logger.error;

var ref = require('when'), defer = ref.defer, promise = ref.promise;

var sequence = require('when/sequence');

var sep = require('path').sep;

var normalize = require('path').normalize;

var init = require('./init');

var deferrals = []    // accumulate array of promises as
                     // each concurrent child is called to load   

module.exports.nextDeferral = function() {

                  // loader wants access to .next

    if (deferrals.length == 0) return false;
    return deferrals.shift().promise;
}

pipeline.createEvent('objective.starting');
pipeline.createEvent('objective.not.promised');
pipeline.createEvent('objective.init.error');
pipeline.createEvent('objective.run.error');
pipeline.createEvent('objective.empty');

module.exports.createLoader = function(root) {
  return promise(function(resolve, reject) {
    root.loadChild = function(filename) {
      debug('loading child %s into root %s', filename, root.config.title);
      return promise(function(resolve, reject, notify){
        var requireFile;
        try {
          requireFile = normalize(root.home + sep + filename);
          objective.loadingChildFrom = root.config.uuid;

          // might not have the file extension,
          // ...so, bumble in the dark a bit

          delete require.cache[requireFile]
          delete require.cache[requireFile + '.js']
          delete require.cache[requireFile + '.coffee']

          require(requireFile);
          waiting = module.exports.nextDeferral();

          if (waiting && typeof waiting.then === 'function') {
            return waiting.then(
              function(result) {
                delete objective.loadingChildFrom;
                delete objective.currentChild;
                resolve(result);
              },
              function(error) {
                delete objective.loadingChildFrom;
                delete objective.currentChild;
                reject(error);
              },
              notify
            );
          }
          warn('no objective in %s', filename);
          resolve();
        }
        catch (e) {
          if (e instanceof SyntaxError) {
            error(e);
            resolve();
            return
          }
          delete objective.loadingChildFrom;
          delete objective.currentChild;
          return reject(e);
        }
      });
    }
    resolve();
  });
}


module.exports.load = function(root, config, callback) {

  config.uuid = (config.uuid || config.filename);

  debug('load child with config', config);

  var deferral, objectiveFile, objectiveFn, me;

  me = {
    config: config,
    root: root
  };

  if (root && root.children)
    // overwrite exitsing with same uuid
    root.children[config.uuid] = me;

  deferrals.push(deferral = defer());

  init.user(config)
  //// blind run will still need plugins
  // .then(function(){

  //   return init.plugins(config)

  // })
.then(function(){

    debug('starting child objective with config', config);

    return module.exports.run(root, config, objectiveFn, deferral);

  }).catch(deferral.reject)


  if (typeof callback == 'function') {

    debug('in callback()');

    objectiveFn = callback;

    if (typeof objective.currentChild !== 'undefined' && objective.currentChild !== null) {
      error('nested or multiple objectives per file not yet supported', config.filename);
      process.exit(1);
    }

    objective.currentChild = me;

    return

  }

  return {

    run: function(fn) {

      debug('in run()');

      objectiveFn = fn;

      if (typeof objective.currentChild !== 'undefined' && objective.currentChild !== null) {
        error('nested or multiple objectives per file not yet supported', config.filename);
        process.exit(1);
      }

      objective.currentChild = me;

    }
  }
};

module.exports.run = function(root, config, objectiveFn, deferral) {

  var required = {}, clearRequire;

  debug('child.run', config);

  // prepare list of already loaded modules to not be flushed
  // after the run

  for (filename in require.cache) required[filename] = {};

  clearRequire = function() {
    // TODO, this wont catch requires before objective() call in child
    for (filename in require.cache) {
      if (typeof required[filename] !== 'undefined') continue;
      delete require.cache[filename];
      debug('Removed from require cache', filename);
    }
  };

  return pipeline.emit('objective.starting', {
      config: config,
      fn: objectiveFn,
      deferral: deferral,
      root: root,
      required: required
  }, function(err, args) {

    debug('Starting objective function.');
    var running;

    if (objectiveFn.toString() === 'function () {}') {

      debug('Empty objective');
      return pipeline.emit('objective.empty',{
        config: config,
        deferral: deferral,
        root: root
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

      var handlePromise = function(running) {
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
      }

      if ((running != null) && (running.then != null) && typeof running.then === 'function') {

        handlePromise(running);
        delete objective.strayPromise;

      } else if (objective.strayPromise) {

        handlePromise(objective.strayPromise);
        delete objective.strayPromise;

      } else {

        debug('Got no promise from objective function');
        return pipeline.emit('objective.not.promised',{
          config: config,
          fn: objectiveFn,
          result: running,
          deferral: deferral,
          root: root
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
        error: err,
        root: root
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

  });
};
