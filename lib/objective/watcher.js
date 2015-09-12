// being unable to find a watcher that always works... going full manual.

var promise = require('when').promise
  , sequence = require('when/sequence')
  , debug = objective.logger.createDebug('watcher')
  , recursive = require('recursive-readdir')
  , normalize = require('path').normalize
  , sep = require('path').sep
  , fs = require('fs')
  ;

module.exports.create = function(root) {
  var watching = {};

  return promise(function(createResolve, createReject) {
    debug('init watcher for root %s, %s', root.config.title, root.config.uuid);

    root.watcher = function(paths, optionsORcallback, callback) {
      return promise(function(resolve, reject, notify) {

        var options, path;
        debug("watching " + (JSON.stringify({paths: paths, options: options})));
        options = optionsORcallback;
        if (typeof optionsORcallback === 'function') {
          callback = optionsORcallback;
          options = {};
        }
        if (paths.constructor.name !== 'Array') {
          paths = [paths];
        }
        options = (options || {});

        return sequence((function(){
          return paths.map(function(path) {
            return function() {
              return promise(function(resolve, reject, notify){
                var fullPath, 
                    matches = [], // ANY of regex
                    refresh;

                if (typeof path != 'string') {
                  matches = path.matches;
                  path = path.path;
                }

                if (path.match(/^\//)) return reject(new Error('Cannot recurse from root.'));
                fullPath = normalize(root.home + sep + path);
                if (!module.exports.pathOk(fullPath, options, reject)) return;
                if (path.match(/^\.\//)) path = path.replace(/^\.\//, '');

                watching[fullPath] = {
                  path: path,
                  files: {},
                  interval: setInterval(function() {
                    refresh(false);
                  }, options.interval || 2000)
                }

                debug('recursing \'%s\' as \'%s\'', path, fullPath);

                refresh = function(first) {
                  
                  recursive(fullPath, function(e, files) {

                    files.filter(function(file) {
                      for(var i = 0; i < matches.length; i++) {
                        if (file.match(matches[i])) return true;
                      }
                      return matches.length == 0;
                    }).forEach(function(file) {
                      if (watching[fullPath].files[file]) return; // already watching

                      watching[fullPath].files[file] = {};

                      debug('watch %s', file);

                      fs.watchFile(file, {interval: 100}, function(curr, prev) {
                        if (!(prev.mtime < curr.mtime)) {
                          return;
                        }

                        debug('changed %s', file);

                      });
                    });
                  });
                }
                refresh(true);

              });
            }
          });
        })()).then(
          function(result){callback(null, result);},
          function(error){
            debug('error', error);
            callback(error);
          },
          function(notify){}
        )
      });
    }

    createResolve();

  });
}

module.exports.pathOk = function(path, options, reject) {
  try {
    var stat = fs.lstatSync(path);
    return true;
  } catch (e) {
    debug('error in recurse', e);
    if (e.code === 'ENOENT' && options.createDir) {
      try {
        mkpath.sync(path);
        warn('created directory %s', path);
        return true;
      } catch (e) {
        error('Could not create directory %s', path);
        reject(e);
        return false;
      }
    }
    reject(e);
    return false;
  }
}