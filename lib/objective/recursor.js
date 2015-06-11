

var fs = require('fs')
  , ref = objective.logger
  , ref1 = require('./globals/pipeline')
  , ref3 = require('path')
  , sep = ref3.sep
  , TODO = ref.TODO
  , info = ref.info
  , warn = ref.warn
  , emit = ref1.emit
  , debug = ref.createDebug('recursor')
  , error = ref.error
  , mkpath = require('mkpath')
  // , isBinaryFile
  , createEvent = ref1.createEvent
  , normalize = ref3.normalize
  , sequence = require('when/sequence')
  , promise = require('when').promise
  // , recurse
  ;

// try {
//   isBinaryFile = require('isBinaryFile');
// } catch (_error) {}

createEvent('files.recurse.start');
createEvent('files.recurse.entering');
createEvent('files.recurse.found');
createEvent('files.recurse.end');
createEvent('files.recurse.error');
createEvent('files.recurse.changed');

module.exports.create = function(root) {
  return promise(function(createResolve, createReject) {
    debug('init recursor for root %s, %s', root.config.title, root.config.uuid);
    
    root.recursor = function(paths, optionsORcallback, callback) {
      return promise(function(recurseResolve, recurseReject, recurseNotify) {

        var options, path;
        debug("Recursing " + (JSON.stringify(paths)));
        options = optionsORcallback;
        if (typeof optionsORcallback === 'function') {
          callback = optionsORcallback;
          options = {};
        }
        if (paths.constructor.name !== 'Array') {
          paths = [paths];
        }
        options = (options || {});

        return sequence(
          paths.map(function(path) {
            return function() {
              return promise(function(resolve, reject) {
                debug('starting in %s', path);
                return emit('files.recurse.start',{
                  root: root,
                  path: path,
                  options: options
                },
                function(err, res) {
                  if (err != null) {
                    return reject(err);
                  }
                  return module.exports.recurse(root, [path], options, function(err, res) {
                    if (err != null) {
                      return reject(err);
                    }
                    return emit('files.recurse.end', {
                      root: root,
                      path: path
                    }, function() {
                      return resolve(res);
                    });
                  })
                });
              })
            }
          })
        ).then(
          function(result) {
            if (typeof callback === 'function') callback(null, result);
            recurseResolve(result);
          },
          function(error) {
            emit('files.recurse.error', {
              root: root,
              error: error,
              options: options
            }, function() {
              if (typeof callback === 'function') callback(null, error);
              recurseReject(error);
            });
          },
          function(notify) {
            recurseNotify(notify);
          }
        );     
      });
    };

    return createResolve();
  });
}

module.exports.recurse = function(root, paths, options, callback) {
                                                        // callback's a bit outofplace
                                                        // among all these promises...
  return sequence((function(){
    return paths.map(function(path) {
      return function() {
        return promise(function(resolve, reject, notify){

          if (path.match(/^\//)) return reject(new Error('Cannot recurse from root.'));
          var fullPath = normalize(root.home + sep + path);
          if (!module.exports.pathOk(fullPath, options, reject)) return;
          if (path.match(/^\.\//)) path = path.replace(/^\.\//, '');

          return emit('files.recurse.entering',{
              root: root,
              path: path,
              options: options
            },
            function(err){
              if (err != null) return reject(err);
              module.exports.enterDirectory(
                root, path, options, resolve, reject, notify
              );
            }
          );
        });
      }
    });
  })()).then(
    function(result){callback(null, result);},
    function(error){ callback(error);},
    function(notify){}
  );
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

module.exports.enterDirectory = function(root, path, options, resolve, reject, notify) {
  var contents;
  var files = [];
  var dirs = [];
  var fullPath = normalize(root.home + sep + path);
  try {
    contents = fs.readdirSync(fullPath);
  } catch (e) {
    return reject(e);
  }  
  contents.forEach(function(f) {
    try {
      var file = fullPath + sep + f;
      var stat = fs.lstatSync(file);
      if (stat.isDirectory()) dirs.push(path + sep + f)
      else files.push(path + sep + f);
    } catch (e) {
      debug('ignored error in recurse', e);
    }
  });
  module.exports.handleFiles(root, files, options)
  .then(function(){
    return module.exports.handleDirectories(root, dirs);
  })
  .then(resolve, reject)
}

module.exports.handleFiles = function(root, files, options) {
  return promise(function(resolve, reject) {
    sequence(files.map(function(file){
      return function(){
        return promise(function(resolve, reject){
          debug("recursor found file " + file);
          return emit('files.recurse.found', {
              root: root,
              path: file,
              options: options,
              watch: false//,
              // load: false
            }, 
            function(err, res) {
              if (err != null) {
                return reject(err);
              }
              // var load = res.load;
              var watch = res.watch;

              if (watch) {
                var fullPath = root.home + sep + file;
                fs.watchFile(fullPath, {interval: 100}, function(curr, prev) {
                  if (!(prev.mtime < curr.mtime)) {
                    return;
                  }
                  return emit('files.recurse.changed', {
                    root: root,
                    options: options,
                    path: file
                  }, function() {
                    // skip reload option
                  });
                });
              }
              // skip load option
              resolve();
            }
          );
        });
      };
    })).then(resolve, reject);
  })
}

module.exports.handleDirectories = function(root, dirs, options) {
  return promise(function(resolve, reject) {
    module.exports.recurse(root, dirs, options, function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

