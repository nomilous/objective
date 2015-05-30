

var fs = require('fs')
  , ref = objective.logger
  , ref1 = require('./globals/pipeline')
  , ref2 = require('also')
  , ref3 = require('path')
  , sep = ref3.sep
  , TODO = ref.TODO
  , info = ref.info
  , emit = ref1.emit
  , debug = ref.createDebug('recursor')
  , error = ref.error
  , mkpath = require('mkpath')
  , isBinaryFile
  , createEvent = ref1.createEvent
  , normalize = ref3.normalize
  , pipeline = ref2.pipeline
  , deferred = ref2.deferred
  , promise = require('when').promise
  , recurse
  ;

try {
  isBinaryFile = require('isBinaryFile');
} catch (_error) {}

createEvent('files.recurse.start');
createEvent('files.recurse.entering');
createEvent('files.recurse.found');
createEvent('files.recurse.end');
createEvent('files.recurse.error');
createEvent('files.recurse.changed');

module.exports.create = function(root) {
  return promise(function(resolve, reject) {
    debug('init recursor for root %s, %s', root.config.title, root.config.uuid);
    
    root.recursor = function(paths, optionsORcallback, callback) {
      var options, path;
      info("Recursing " + (JSON.stringify(paths)));
      options = optionsORcallback;
      if (typeof optionsORcallback === 'function') {
        callback = optionsORcallback;
        options = {};
      }
      if (paths.constructor.name !== 'Array') {
        paths = [paths];
      }
      return pipeline((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = paths.length; i < len; i++) {
          path = paths[i];
          results.push((function(path) {
            return deferred(function(arg) {
              var reject, resolve;
              resolve = arg.resolve, reject = arg.reject;
              return emit('files.recurse.start', {
                root: root,
                path: path
              }, function(err, res) {
                if (err != null) {
                  return reject(err);
                }
                return recurse(root, [path], options, function(err, res) {
                  if (err != null) {
                    return reject(err);
                  }
                  return emit('files.recurse.end', {
                    root: root,
                    path: path
                  }, function() {
                    return resolve(res);
                  });
                });
              });
            });
          })(path));
        }
        return results;
      })()).then(function(result) {
        return callback(null, result);
      }, function(error) {
        return emit('files.recurse.error', {
          root: root,
          error: error
        }, function() {
          return callback(error);
        });
      });
    };
    return resolve();
  });
}

recurse = function(root, paths, options, callback) {
  var path;
  return pipeline((function() {
    var i, len, results;
    results = [];
    for (i = 0, len = paths.length; i < len; i++) {
      path = paths[i];
      results.push((function(path) {
        return deferred(function(arg) {
          var e, reject, resolve, stat;
          resolve = arg.resolve, reject = arg.reject;
          if (path.match(/^\//)) {
            return reject(new Error('Cannot recurse from root.'));
          }
          try {
            stat = fs.lstatSync(path);
            if (!stat.isDirectory()) {
              return reject(new Error('Cannot recurse file ' + path));
            }
          } catch (_error) {
            e = _error;
            if (e.errno !== 34) {
              return reject(e);
            }
            if (!options.createDir) {
              return reject(e);
            }
            try {
              mkpath.sync(path);
            } catch (_error) {
              e = _error;
              return reject(e);
            }
          }
          return emit('files.recurse.entering', {
            root: root,
            path: path
          }, function(err) {
            var contents, directories, f, file, files, j, len1;
            if (err != null) {
              return reject(err);
            }
            contents = fs.readdirSync(path);
            files = [];
            directories = [];
            for (j = 0, len1 = contents.length; j < len1; j++) {
              f = contents[j];
              f = path + sep + f;
              try {
                stat = fs.lstatSync(f);
                if (stat.isDirectory()) {
                  directories.push(f);
                  continue;
                }
                files.push(f);
              } catch (_error) {
                e = _error;
                return reject(e);
              }
            }
            return pipeline((function() {
              var k, len2, results1;
              results1 = [];
              for (k = 0, len2 = files.length; k < len2; k++) {
                file = files[k];
                results1.push((function(file) {
                  return deferred(function(arg1) {
                    var reject, resolve;
                    resolve = arg1.resolve, reject = arg1.reject;
                    debug("recursor found file " + file);
                    return emit('files.recurse.found', {
                      root: root,
                      path: file,
                      watch: false,
                      load: false
                    }, function(err, arg2) {
                      var load, watch;
                      watch = arg2.watch, load = arg2.load;
                      if (err != null) {
                        return reject(err);
                      }
                      try {
                        if (isBinaryFile(file)) {
                          return resolve();
                        }
                      } catch (_error) {}
                      if (watch) {
                        fs.watchFile(file, {
                          interval: 100
                        }, function(curr, prev) {
                          if (!(prev.mtime < curr.mtime)) {
                            return;
                          }
                          return emit('files.recurse.changed', {
                            root: root,
                            path: file
                          }, function() {});
                        });
                      }
                      if (load) {
                        try {
                          require(process.cwd() + sep + file);
                          return resolve();
                        } catch (_error) {
                          e = _error;
                          return reject(e);
                        }
                      }
                      return resolve();
                    });
                  });
                })(file));
              }
              return results1;
            })()).then(function(result) {
              return recurse(root, directories, options, function(err, res) {
                if (err != null) {
                  return reject(err);
                }
                return resolve(res);
              });
            }, function(error) {
              return reject(error);
            });
          });
        });
      })(path));
    }
    return results;
  })()).then(function(result) {
    return callback(null, result);
  }, function(error) {
    return callback(error);
  }, function(notify) {});
};
