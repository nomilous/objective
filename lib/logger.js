// default to error if undefined
if (typeof process.env.DEBUG === 'undefined') {
  process.env['DEBUG'] = 'error,warn'; // comma separeted list
}

var debug = require('debug');

//debug.resetFd();

// console.log(debug.enable);

var info    = debug('info');
var warn    = debug('warn');
var error   = debug('error');
var TODO    = debug('TODO');
var debugs  = {};

module.exports.reset = function() {
  // todo - reset debugs from new env var
}

module.exports.info = function() {
  info.apply(this, arguments);
}

module.exports.warn = function() {
  warn.apply(this, arguments);
}

module.exports.error = function() {
  error('in - ' + objective.getCallerFileName(2));
  error.apply(this, arguments);
}

module.exports.TODO = function() {
  TODO.apply(this, arguments);
}

module.exports.createDebug = function(name) {
  //if (debugs[name] !== 'undefined') return debugs[name];
  debugs[name] = debug('debug:' + name);
  return function() {
    debugs[name].apply(this, arguments);
  }
}
