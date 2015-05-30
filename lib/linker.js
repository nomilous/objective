var logger = objective.logger
  , debug = logger.createDebug('linker')
  , error = logger.error
  , TODO = logger.TODO
  , promise = require('when').promise
  , sep = require('path').sep
  , normalize = require('path').normalize
  , root = require('./root')


module.exports.create = function(root) {
  return promise(function(createResolve, createReject) {
    debug('init linker for root %s, %s', root.config.title, root.config.uuid);

    root.linker = function() {
      return promise(function(resolve, reject, notify) {
        error('child linker not yet implemented');
        resolve();
      });
    };

    root.linker.root = function(objectiveFile) {
      TODO('handle array, or object tree with configs');
      debug('linking to root at %s', objectiveFile);
      return promise(function(linkResolve, linkReject, linkNotify) {
        var file, waiting;
        objective.loadAsRoot = true;
        file = normalize(root.home + sep + objectiveFile);
        debug('linker linking root at %s', file);
        try {

          require(file);
          waiting = objective.rootWaiting;

          if (!waiting) {
            error('No root to link at %s', file)
            return linkReject(new Error('Missing objective ', file));
            delete objective.loadAsRoot;
          }

          waiting.then(linkResolve, linkReject, linkNotify);
          if (typeof waiting.start === 'function') waiting.start();

        } catch(e) {
          delete objective.loadAsRoot;
          error('link root failed for %s', file, e.stack);
          return linkReject(e);
        }
      })
    };

    return createResolve();
  });
}
