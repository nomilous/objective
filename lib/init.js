var       ref1 = objective.logger
  , normailze = require('path').normalize
  , sequence = require('when/sequence')
  , promise = require('when').promise
  , debug = ref1.createDebug('init')
  , error = ref1.error
  , info = ref1.info
  , TODO = ref1.todo
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

  return promise(function(resolve, reject){

    if (config.plugins.length == 0) {
      debug('No plugins to load');
      return resolve();
    }

    sequence( config.plugins.map( function(plugin){

      return function() {
        return promise(function(resolve, reject){
          var mod, defaults, name;
          
          if (typeof plugin === 'string') {
            if (plugin.match(/\.\//))
              plugin = normailze(process.cwd() + sep + plugin);
            try {
              debug('Loading plugin from', plugin);
              mod = require(plugin);
              if (objective.user !== 'undefined' && objective.user !== null) {
                defaults = objective.user.defaults[plugin]
                if (defaults !== 'undefined' && defaults !== null) {
                  for (key in defaults) mod[key] = defaults[key]
                }
              }
            } catch (e) {
              debug('error loading plugin', plugin, e);
              return reject(e);
            }
          }

          if (typeof mod.$$name != 'string') {
            return reject(new Error('Objective plugins must respond to $$name property.'))
          }

          name = mod.$$name;
          if (typeof objective.plugins[name] !== 'undefined') {
            debug('Plugin ' + name + ' already loaded.');
            return resolve();
          }
          if (typeof mod.init === 'function')
            return mod.init(function(err){
              if (typeof err !== 'undefined' && err !== null) {
                debug('Plugin "' + name + '" init failed', err);
                return reject(err);
              }
              debug('Plugin "' + name + '" loaded with init()');
              objective.plugins[name] = mod;
              return resolve();
            });

          debug('Plugin "' + name + '" loaded without init().')
          objective.plugins[name] = mod;
          return resolve();

        })
      }

    })).then(resolve).catch(reject);
  });
};

