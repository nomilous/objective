var       ref1 = objective.logger
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

    var addDefaultPlugins, configDir, userFile;

    config.plugins = (config.plugins || []);

    // add plugins to config only if not present
    addDefaultPlugins = function(defaults) {
      defaults.forEach(function(plugin) {
        if (typeof plugin === 'string') {
          if (config.plugins.indexOf(plugin) != -1) return;
          config.plugins.push(plugin);
        }
      })
    }

    if (objective.user != null) {
      debug('User already loaded');
      // TODO('if the plugin is an object this will add over and over');
      // addDefaultPlugins(objective.user.plugins || []);
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
          addDefaultPlugins(user.plugins || []);
          debug('User loaded with init().');
          return resolve();
        });

      objective.user = user;
      addDefaultPlugins(user.plugins || []);
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

// init plugins from config

module.exports.plugins = function(config) {

  objective.plugins = (objective.plugins || {});

  return promise(function(resolve, reject, notify){

    sequence((function() {
      var functions = [];
      for (var key in config.plugins) {
        functions.push((function(key) {
          return function() {
            return promise(function(resolve, reject, notify){
              var root, defaultConfig, pluginConfig;
              try {

                requireName = key;

                debug('Loading plugin %s', key);

                // plugins are installed agains the root objective,
                // this allows running multiple concurrent root objectives
                // with the same process EACH using the same plugin
                //                       BUT with different config

                root = objective.findRoot({uuid:config.uuid});

                if (key.match(/\.\//)) {
                  requireName = normalize(root.config.home + sep + key);
                }

                root.plugins = (root.plugins || {});

                if (typeof root === 'undefined') {
                  error('missing root for plugin %s', key);
                  return reject(new Error('Missing root.'));
                }

                debug('Adding plugin to root', root);

                // get config defaults from user
                // NB. dangerous not to include all config per
                //     objective, using user defaults means
                //     others need the same defaults to work
                //     properly!

                try {
                  defaultConfig = objective.user.defaults[key];
                } catch (e) {
                  defaultConfig = {};
                }

                debug('Got user defaults', defaultConfig);

                // overwrite user defauls from objective config

                pluginConfig = config.plugins[key];

                objective.merge(pluginConfig, defaultConfig);

                debug('Starting plugin with config', pluginConfig);

                Plugin = require(requireName);

                // Plugin must define $$name

                if (typeof root.plugins[Plugin.$$name] !== 'undefined') {
                  debug('Plugin %s already loaded.', key);
                  return resolve();
                }

                // Plugin must have async 'factory'

                if (typeof Plugin.create !== 'function') {
                  error('Plugin %s must define create()', key);
                  return reject(new Error('Incompatible plugin.'));
                }

                Plugin.create(root, pluginConfig, function(err, plugin) {

                  if (err) {
                    error('Plugin factory failed', err);
                    return reject(err);
                  }

                  root.plugins[Plugin.$$name] = plugin;

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

