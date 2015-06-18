
var normalize = require('path').normalize
  , sequence = require('when/sequence')
  , pipeline = objective.pipeline
  , dirname = require('path').dirname
  , promise = require('when').promise
  , logger = objective.logger
  , debug = objective.logger.createDebug('injector')
  , sep = require('path').sep
  , EOL = require('os').EOL
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

module.exports = function(opts, fn) {
  
  debug('injecting', '\nopts:\n', opts, '\ninto:', fn);
  var startWith;
  var proxyPromise = promise(function(resolve, reject, notify) {

    var handlingCancel
      , handlingError
      , handlingNext
      , runWithArgs
      , errPosition
      , origPaths
      , promised
      , inject
      , alias
      , next
      , args
      , i
      ;

    if (typeof opts === 'function') {
      fn = opts;
      opts = {};
    }
    if (typeof opts.ignoreInjectError === 'undefined') {
      opts.ignoreInjectError = false;
    }
    if (typeof opts.redirectInjectError === 'undefined') {
      opts.redirectInjectError = false;
    }
    opts.args || (opts.args = []);
    args = objective.argsOf(fn);
    runWithArgs = [];
    handlingCancel = false;
    handlingError = false;
    handlingNext = false;

    i = -1;

    sequence(args.map(function(arg){
      return function() {
        return promise(function(resolve, reject) {

          debug("with arg " + arg);

          i++;

          if (arg === 'e' || arg === 'er' || arg === 'err' || arg === 'error') {
            debug("injecting error");
            runWithArgs.push(opts.error || null);
            errPosition = i;
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

          if (arg === 'require') {
            debug("injecting require");
            runWithArgs.push(opts.require);
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

          if (opts.root && opts.root.config.aliases) {
            if (opts.root.config.aliases[arg]) {
              alias = opts.root.config.aliases[arg];
              if (typeof alias === 'string') {
                try {
                  runWithArgs.push(
                    objective.require(alias).from({
                      dirname: opts.root.home,
                      includeLocal: true
                    })
                  );
                  return resolve();
                } catch (e) {
                  runWithArgs.push(null);
                  return resolve(e);
                }
              } else {
                runWithArgs.push(alias);
                return resolve();
              } 
            }
          }
          
          if (opts.args.length > 0) {
            debug("injecting arg");
            runWithArgs.push(opts.args.shift());
            return resolve();
          }

          pipeline.emit('objective.injecting', {
            root: opts.root,
            config: opts.config,
            fn: opts.fn,
            allArgs: args,
            thisName: arg,
            thisValue: undefined
          }, function(e, res) {

            if (e) return resolve(e);

            if (typeof res.thisValue !== 'undefined') {
              debug("injecting '%s'", arg, res.thisValue);
              runWithArgs.push(res.thisValue);
              return resolve();
            }

            try {
              runWithArgs.push(
                objective.require(arg).from({
                  dirname: opts.root.home,
                  includeLocal: true
                })
              );
              resolve();
            } catch (e) {
              try {
                runWithArgs.push(
                  objective.require('objective_'+arg).from({
                    dirname: opts.root.home,
                    includeLocal: true
                  })
                );
                resolve();
              } catch (e) {}
              resolve(e);
            }
          })        
        });
      }
    })).then(function(results){
      var err;
      for (i = 0; i < results.length; i++) {
        if (results[i] instanceof Error) {
          err = results[i];
          break; // can only pass first error
        }
      }
      if (err) {
        if (typeof opts.onInjectError === 'function') {
          err = opts.onInjectError(err);
          return inject(err);
        }
        if (opts.ignoreInjectError || opts.redirectInjectError) {
          return inject(err);
        }
        // logger.error('Injection Failure', err, err.stack);
        return reject(err);
      }
      inject(null);
    });


    next = function() {
      if (typeof opts.next === 'function') {
        if(!handlingNext && !handlingCancel) {
          opts.next();
        }
      }
    }

    inject = function(err) {
      if ((opts.error != null) && !handlingError) {
        logger.error('unaccepted error injected', opts.error.stack);
      }
      var promised;
      var redirectedError = false;
      try {
        if (err) {
          if (opts.redirectInjectError) {
            if (errPosition >= 0) {
              runWithArgs[errPosition] = err;
              redirectedError = true;
            } else {
              if (!opts.ignoreInjectError) {
                // console.log();
                // logger.error(-1, err.toString());
                next(); // should pipelines keep going on error...?
                return reject(err);
              }
            }
          }
        }
        promised = fn.apply(opts.context, runWithArgs);
      } catch(e) {
        next(); // ...?
        return reject(e);
      }
      next();
      if (typeof promised === 'undefined' 
        || typeof promised.then !== 'function') {
        if (typeof opts.onMissingPromise === 'function') {
          promised = opts.onMissingPromise();
        } else {
          return resolve()
        }
      }
      if (startWith && typeof promised.start === 'function') {
        var args = Object.keys(startWith).map(function(key){
          return startWith[key]
        });
        if (!redirectedError) {
          args.unshift(err);
        } else {
          args.unshift(null);
        }
        promised.start.apply(opts.context, args);
      }
      promised.then(resolve, reject, notify);
    }

  });

  proxyPromise.start = function() {
    startWith = arguments;
  }
  
  return proxyPromise;
};
