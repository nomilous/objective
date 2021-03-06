var ref1 = objective.logger
  , initialized = false
  , normalize = require('path').normalize
  , sequence = require('when/sequence')
  , promise = require('when').promise
  , debug = ref1.createDebug('init')
  , error = ref1.error
  , info = ref1.info
  , TODO = ref1.TODO
  , sep = require('path').sep
  ;


// init user from $HOME/.objective/user if present

module.exports.user = function(config) {

  return promise(function(resolve, reject){

    var configDir, userFile, user;

    if (initialized) {
      debug('User already Initialized');
      return resolve();
    }

    initialized = true;

    if (objective.user != null) {
      debug('User already loaded');
      return resolve();
    }

    configDir = process.env[process.platform === 'win32' 
                ? 'USERPROFILE' 
                : 'HOME'] + sep + '.objective';
    userFile = configDir + sep + 'user';

    try {
      debug('Loading user from file', userFile);
      user = require(userFile);

      if (typeof user.init == 'function') 
        return user.init(function(err){
          if (err != null) {
            debug('User init error', err);
            return reject(err);
          }
          objective.user = user;
          debug('User loaded with init().');
          return resolve();
        });

      objective.user = user;
      debug('User loaded without init().');
      return resolve()

    } catch (e) {
      if (e.code == 'MODULE_NOT_FOUND') {
        objective.user = 'none';
        return resolve();
      }
      error('Error loading user', e);
      reject(e);
    }
  });
};

// init plugins config

module.exports.plugins = function(config) {

  return promise(function(resolve, reject, notify){

    sequence((function() {
      var functions = [];
      for (var key in config.plugins) {
        functions.push((function(key) {
          return function() {
            return promise(function(resolve, reject, notify){
              var root, pluginConfig, requireName, Plugin;
              try {

                requireName = key;

                debug('Loading plugin %s', key);

                // plugins are installed against the root objective,
                // this allows running multiple concurrent root objectives
                // with the same process EACH using the same plugin
                //                       BUT with different config

                root = objective.findRoot({uuid:config.uuid});

                if (key.match(/\.\//)) {
                  requireName = normalize(root.home + sep + key);
                }

                root.plugins = (root.plugins || {});

                if (typeof root === 'undefined') {
                  error('missing root for plugin %s', key);
                  return reject(new Error('Missing root.'));
                }

                debug('Adding plugin to root', root);

                pluginConfig = config.plugins[key];

                debug('Starting plugin at require \'%s\' with config', requireName, pluginConfig);

                if (objective.pluginsLoaded[requireName]) {
                  // allow only one definition of each plugin
                  Plugin = objective.pluginsLoaded[requireName];
                } else {
                  Plugin = objective.require(requireName).from({
                    dirname: root.home,
                    includeLocal: true // objective_dev is included in objective
                  });
                }

                // Plugin must define $$name

                if (typeof root.plugins[Plugin.$$name] !== 'undefined') {
                  debug('Plugin %s already loaded.', key);
                  return resolve();
                }

                // objective.plugins = (objective.plugins || {});
                objective.plugins[Plugin.$$name] = Plugin;
                objective.pluginsLoaded[requireName] = Plugin;

                // objective.pluginsLoaded = (objective.pluginsLoaded || {});

                // Plugin must have async 'factory' $$createInstance to create 
                // per root instances

                if (typeof Plugin.$$createInstance !== 'function') {
                  error('Plugin \'%s\' must define $$createInstance()', key);
                  return reject(new Error('Incompatible plugin.'));
                }

                Plugin.$$createInstance(root, pluginConfig, function(err, plugin) {

                  if (err) {
                    error('Plugin factory failed', err);
                    return reject(err);
                  }

                  debug('Plugin "'+ Plugin.$$name +'" loaded ok.');
                  root.plugins[Plugin.$$name] = plugin;
                  resolve();

                });

              } catch(e) {
                error('Exception loading plugin %s', key, e);
                return reject(e);
              }
            });
          }
        })(key));
      }
      return functions;
    })()).then(resolve, reject, notify);


  });

};

