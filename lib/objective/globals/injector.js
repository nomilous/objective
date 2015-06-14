
var ref = objective.logger
  , debug = ref.createDebug('injector')
  , error = ref.error
  , TODO = ref.TODO
  , info = ref.info
  , dirname = require('path').dirname
  , sep = require('path').sep
  , normalize = require('path').normalize
  ;

TODO('injection aliases from config');

module.exports = function(opts, fn) {
  debug('injecting', '\nopts:\n', opts, '\ninto:', fn);
  var arg, args, e, handlingError, handlingNext, i, len, promise, runWithArgs, origPaths;
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  opts.args || (opts.args = []);
  args = objective.argsOf(fn);
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
    } else if (arg === 'link') {
      debug("injecting linker");
      runWithArgs.push(opts.link);
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
        var origPaths = module.paths;
        if (opts.startIn) {
          var build = function(path, paths) {
            paths.push(normalize(path + sep + 'node_modules'));
            if (path.length < 4) return paths;
            return build(dirname(path), paths);
          }
          module.paths = build(opts.startIn,[]);
        }
        runWithArgs.push(require(arg));
        module.paths = origPaths;
      } catch (_error) {
        module.paths = origPaths;
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
  promise = fn.apply(opts.context, runWithArgs);
  if (typeof opts.next === 'function' && !handlingNext) {
    opts.next();
  }
  return promise;
};