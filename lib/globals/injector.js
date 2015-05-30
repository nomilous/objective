
var ref = objective.logger
  , debug = ref.createDebug('injector')
  , error = ref.error
  , TODO = ref.TODO
  , info = ref.info
  , util = require('also').util
  ;

TODO('injection aliases from config');

module.exports = function(opts, fn) {
  var arg, args, e, handlingError, handlingNext, i, len, promise, runWithArgs;
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  opts.args || (opts.args = []);
  args = util.argsOf(fn);
  runWithArgs = [];
  handlingError = false;
  handlingNext = false;
  for (i = 0, len = args.length; i < len; i++) {
    arg = args[i];
    debug("with arg " + arg);
    if (arg === 'e' || arg === 'er' || arg === 'err' || arg === 'error') {
      debug("injecting error");
      runWithArgs.push(opts.error || null);
      handlingError = true;
    } else if (arg === 'next' || arg === 'done') {
      debug("injecting next");
      runWithArgs.push(opts.next || function() {});
      handlingNext = true;
    } else if (arg === 'plugins') {
      debug("injecting plugins");
      runWithArgs.push(opts.plugins || {});
    } else if (arg === 'recurse') {
      debug("injecting recursor");
      runWithArgs.push(opts.recurse);
    } else if (arg === 'cancel') {
      debug("injecting cancel");
      runWithArgs.push(opts.cancel || function() {});
    } else if (objective.globals.indexOf(arg) >= 0) {
      debug("injecting global '" + arg + "'");
      runWithArgs.push(objective[arg]);
    } else if (opts.args.length > 0) {
      debug("injecting arg");
      runWithArgs.push(opts.args.pop());
    } else {
      debug("injecting module '" + arg + "'");
      try {
        runWithArgs.push(require(arg));
      } catch (_error) {
        e = _error;
        if (opts.onError) {
          opts.onError(e);
        } else {
          error(e);
        }
      }
    }
  }
  if ((opts.error != null) && !handlingError) {
    error(opts.error.stack);
  }
  promise = fn.apply(null, runWithArgs);
  if (typeof opts.next === 'function' && !handlingNext) {
    opts.next();
  }
  return promise;
};
