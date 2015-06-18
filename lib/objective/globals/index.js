var debug = objective.logger.createDebug('globals');

var globals = ['pipeline', 'injector', 'prompt', 'require']

globals.forEach(function(name) {
  objective[name] = require('./' + name);
});

objective.coffee = require('coffee-script');
objective.coffee.register();

module.exports = globals;
