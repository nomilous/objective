
var normalize = require('path').normalize
  , sequence = require('when/sequence')
  , pipeline = objective.pipeline
  , dirname = require('path').dirname
  , promise = require('when').promise
  , logger = objective.logger
  , debug = objective.logger.createDebug('injector')
  , sep = require('path').sep
  ;

logger.TODO('injection aliases from config');

                    /*
                     * Here is a *Thing*
                     * -----------------
                               ? 
                               *
                               *
                               * This injection is asynchronous!
                               * 
                               * Here it queries for what to inject down a 
                               * middleware pipeline where any number of 
                               * waiting plugins can populate the missing 
                               * function argument.
                               * 
                               * Even from some remote source.
                               * 
                               * Things like just-in-time npm installs.
                               * 
                               * Powerful, Dangerous
                               * 
                               *
                               *
                            \  *  /
                             \ * /
                              \*/
//                             v
pipeline.createEvent('objective.injecting');

module.exports = function(root, opts, fn) {
  
  debug('injecting', '\nopts:\n', opts, '\ninto:', fn);
  var startWith;
  var proxyPromise = promise(function(resolve, reject, notify) {

    var handlingCancel
      , handlingError
      , handlingNext
      , runWithArgs
      , origPaths
      , promised
      , inject
      , args
      ;

    if (typeof opts === 'function') {
      fn = opts;
      opts = {};
    }
    if (typeof opts.ignoreError === 'undefined') {
      opts.ignoreError = false;
    }
    opts.args || (opts.args = []);
    args = objective.argsOf(fn);
    runWithArgs = [];
    handlingCancel = false;
    handlingError = false;
    handlingNext = false;

    inject = function(err) {
      if ((opts.error != null) && !handlingError) {
        logger.error('unaccepted error injected', opts.error.stack);
      }
      var promised = fn.apply(opts.context, runWithArgs);
      if (typeof opts.next === 'function') {
        if(!handlingNext && !handlingCancel) {
          opts.next();
        }
      }
      if (typeof promised === 'undefined' 
        || typeof promised.then !== 'function') {
        return resolve()
      }
      if (startWith && typeof promised.start === 'function') {
        var args = Object.keys(startWith).map(function(key){
          return startWith[key]
        });
        args.unshift(err);
        promised.start.apply(opts.context, args);
      }
      promised.then(resolve, reject, notify);
    }

    sequence(args.map(function(arg){
      return function() {
        return promise(function(resolve, reject) {

          debug("with arg " + arg);

          if (arg === 'e' || arg === 'er' || arg === 'err' || arg === 'error') {
            debug("injecting error");
            runWithArgs.push(opts.error || null);
            handlingError = true;
            return resolve();
          }

          if (arg === 'next' || arg === 'done') {
            debug("injecting next");
            runWithArgs.push(opts.next || function() {});
            handlingNext = true;
            return resolve();
          }

          if (arg === 'plugins') {
            debug("injecting plugins");
            runWithArgs.push(opts.plugins || {});
            return resolve();
          }

          if (arg === 'recurse') {
            debug("injecting recursor");
            runWithArgs.push(opts.recurse);
            return resolve();
          }
          
          if (arg === 'link') {
            debug("injecting linker");
            runWithArgs.push(opts.link);
            return resolve();
          }
          
          if (arg === 'cancel' || arg === 'stop') {
            debug("injecting cancel");
            handlingCancel = true;
            runWithArgs.push(opts.cancel || function() {});
            return resolve();
          }
          
          if (objective.globals.indexOf(arg) >= 0) {
            debug("injecting global '" + arg + "'");
            runWithArgs.push(objective[arg]);
            return resolve();
          }
          
          if (opts.args.length > 0) {
            debug("injecting arg");
            runWithArgs.push(opts.args.shift());
            return resolve();
          }

          pipeline.emit('objective.injecting', {
            root: root,
            allArgs: args,
            thisName: arg,
            thisValue: undefined
          }, function(e, res) {

            if (e) return reject(e);
            if (typeof res.thisValue !== 'undefined') {
              debug("injecting '%s'", arg, res.thisValue);
              runWithArgs.push(res.thisValue);
              return resolve();
            }

            try {
              // Fall back to node_modules
              // Rebuild module search paths from callers perspective
              var origPaths = module.paths;
              if (opts.startIn) {
                var build = function(path, paths) {
                  paths.push(normalize(path + sep + 'node_modules'));
                  if (path.length < 4) return paths;
                  return build(dirname(path), paths);
                }
                module.paths = build(opts.startIn,[]);
                // left out ~/.node_modules
              }
              runWithArgs.push(require(arg));
              module.paths = origPaths;
              resolve();
            } catch (e) {
              module.paths = origPaths;
              reject(e);
            }
          })        
        });
      }
    })).then(
      function(){
        inject(null);
      },
      function(err) {
        if (typeof opts.onError === 'function') {
          opts.onError(err);
        } else {
          if (!opts.ignoreError) {
            logger.error('Injection Failure', err, err.stack);
            return reject(err);
          }
        }

        if (!opts.ignoreError) return resolve();

        // passes err to start(arg1,.)
        inject(err);
      }
    );
  });

  proxyPromise.start = function() {
    startWith = arguments;
  }
  
  return proxyPromise;
};
