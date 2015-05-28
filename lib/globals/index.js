var debug = objective.logger.createDebug('globals');

var globals = []

var fs = require('fs');

fs.readdirSync(__dirname).forEach(function(file) {

  if (file == 'index.js') return;

  file = file.replace('.js', '');

  objective[file] = require('./' + file);

  globals.push(file);

})

module.exports = globals;

objective.coffee = require('coffee-script');

objective.coffee.register();
