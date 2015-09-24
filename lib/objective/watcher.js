// being unable to find a watcher that always works... going full manual.

var promise = require('when').promise
  , sequence = require('when/sequence')
  , debug = objective.logger.createDebug('watcher')
  , info = objective.logger.info
  , warn = objective.logger.warn
  , error = objective.logger.error
  , mkpath = require('mkpath')
  , recursive = require('recursive-readdir')
  , normalize = require('path').normalize
  , sep = require('path').sep
  , fs = require('fs')
  , emit = require('./globals/pipeline').emit
  , createEvent = require('./globals/pipeline').createEvent
  ;

// TODO: hameln, flatten

createEvent('files.watch.start');
createEvent('files.watch.found');
createEvent('files.watch.end');
createEvent('files.watch.changed');
createEvent('files.watch.error');

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
                    refresh,
                    firstDone = false;

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

                  if (!first && !firstDone) return;
                  
                  recursive(fullPath, function(e, files) {

                    files = files

                    .filter(function(file) {
                      for(var i = 0; i < matches.length; i++) {
                        if (file.match(matches[i])) return true;
                      }
                      return matches.length == 0;
                    })

                    .map(function(file) {
                      return file.replace(fullPath , path);
                    })

                    .filter(function(file) {
                      return typeof watching[fullPath].files[file] == 'undefined'
                    })

                    if (!first) {
                      return files.forEach(function(file) {
                        debug('watch %s', file);
                        watching[fullPath].files[file] = {};

                        return emit('files.watch.found',{
                          root: root,
                          path: path,
                          file: file,
                          matches: matches,
                          options: options
                        }, function(err, res) {
                          fs.watchFile(file, {interval: 100}, function(curr, prev) {
                            if (!(prev.mtime < curr.mtime)) {
                              return;
                            }
                            debug('changed %s', file);
                            return emit('files.watch.changed',{
                              root: root,
                              path: path,
                              file: file,
                              matches: matches,
                              options: options
                            }, function(err, res) {});
                          });
                        });
                      });
                    }

                    return sequence(
                      files.map(function(file) {
                        return function() {
                          return promise(function(resolve, reject) {
                            debug('watch %s', file);
                            watching[fullPath].files[file] = {};
                            return emit('files.watch.found',{
                              root: root,
                              path: path,
                              file: file,
                              matches: matches,
                              options: options
                            }, function(err, res) {
                              if (err) debug('error', err);
                              resolve();
                              fs.watchFile(file, {interval: 100}, function(curr, prev) {
                                if (!(prev.mtime < curr.mtime)) {
                                  return;
                                }
                                debug('changed %s', file);
                                return emit('files.watch.changed',{
                                  root: root,
                                  path: path,
                                  file: file,
                                  matches: matches,
                                  options: options
                                }, function(err, res) {
                                });
                              });
                            });
                          });
                        }
                      })
                    ).then(
                      function() {
                        return emit('files.watch.end',{
                          root: root,
                          path: path,
                          matches: matches,
                          options: options
                        }, function(err, res) {
                          firstDone = true;
                          resolve();
                        });
                      },
                      function(e) {
                        return emit('files.watch.error',{
                          root: root,
                          path: path,
                          error: e,
                          matches: matches,
                          options: options
                        }, function(err, res) {
                          firstDone = false;
                          reject(e);
                        });
                        
                      }
                    )
                  });
                }

                return emit('files.watch.start',{
                  root: root,
                  path: path,
                  matches: matches,
                  options: options
                }, function(err, res) {
                  refresh(true);
                });

              });
            }
          });
        })()).then(
          function(result){
            resolve(result);
            if (callback) callback(null, result);
          },
          function(error){
            reject(error);
            debug('error', error);
            if (callback) callback(error);
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