var debug = objective.logger.createDebug('child');

var pipeline = objective.pipeline;

var TODO = objective.logger.TODO;

var warn = objective.logger.warn;

var error = objective.logger.error;

var ref = require('when'), defer = ref.defer, promise = ref.promise;

var sequence = require('when/sequence');

var sep = require('path').sep;

var dirname = require('path').dirname;

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
pipeline.createEvent('objective.used.modules');

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

  if (root.children[config.uuid]) {
    Object.defineProperty(root.children[config.uuid],'required',{
      enumerable: false,
      value: required
    });
  }
  for (filename in require.cache) {
    required[filename] = {};
  }

  clearRequire = function() {

    // TODO, this wont catch requires before objective() call in child

    var used = [];

    for (filename in require.cache) {
      if (typeof required[filename] !== 'undefined') continue;
      delete require.cache[filename];
      used.push(filename);
      debug('Removed from require cache', filename);
    }

    pipeline.emit('objective.used.modules', {
      root: root,
      config: config,
      used: used,
    }, function() {});

  };

  return pipeline.emit('objective.starting', {
      config: config,
      fn: objectiveFn,
      deferral: deferral,
      root: root,
      required: required
  }, function(err, args) {

    debug('Starting objective function.');

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

    var running = objective.injector({
      root: root,
      config: config,
      fn: objectiveFn,
      moduleInjectFrom: dirname(root.home + sep + config.filename),
      ignoreInjectError: true,
      redirectInjectError: true, // send inject error into objective 
                                // at arg 'e','err' or 'error'
                               // (if present)
      onMissingPromise: function() {
        if (typeof objective.promised === 'undefined') {
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
        return objective.promised;
      }
    }, objectiveFn)

    running.then(
      function(res) {

        // objective.done event??

        clearRequire();
        delete objective.promised;
        objective.currentChild = null;
        return deferral.resolve(res);
      },
      function(err) {
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
          delete objective.promised;
          objective.currentChild = null;
          if (payload.error !== 'undefined' && payload.error != null)
            return deferral.reject(payload.error);
          return deferral.resolve(payload.result);
        });
      },
      deferral.notify
    )
    return running.start();

  });
};
