/*****************************
 *
 * Injecting args as modules by name means the require
 * runs from the location of the objective module that
 * is calling require on behalf of the caller.
 * 
 * This means that the module.paths need to be modified
 * so that require walks for node_modules from the 
 * callers perspective.
 * 
 */

module.exports = Require;

var sep = require('path').sep;

function Require(mod) {
  var e = objective.logger.error.pend(2, 'Require for \'%s\' did not specify from(opts)', mod);
  process.nextTick(function(){
    if (typeof mod !== 'undefined') e.trigger();
  })
  return {
    from: function(opts) {

      if (typeof opts === 'undefined') return require(mod);
      if (typeof opts.dirname === 'undefined') return require(mod);

      var parts = opts.dirname.split(sep);
      var add = [];
      var origPaths = module.paths.slice();
      var m;

      var addPath = function(part) {
        if (typeof part === 'undefined') return;
        // dunno what windows looks like
        // hopefully sep does it and 'c:' is part 0
        add.push(part);
        module.paths.unshift(add.join(sep) + sep + 'node_modules');
        addPath(parts.shift());
      }

      if (!opts.includeLocal) module.paths.length = 0;

      addPath(parts.shift());

      try {
        m = require(mod);
        if (opts.getPath) {
          opts.getPath(require.resolve(mod));
        }
        module.paths = origPaths;
        mod = undefined
        return m;
      } catch (e) {
        module.paths = origPaths;
        mod = undefined
        throw e;
      }
    }
  }
}
