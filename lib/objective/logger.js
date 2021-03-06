
// default to error if undefined
if (typeof process.env.DEBUG === 'undefined') {
  process.env['DEBUG'] = 'error,warn'; // comma separeted list
}

var debug = require('debug');
var path  = require('path');

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

module.exports.error = function(depth) {
  var caller, args = arguments, _arguments = arguments;
  if (!isNaN(depth)) {
    args = [];
    if (depth >= 0) caller = objective.getCaller(depth,true);
    Object.keys(arguments).forEach(function(k) {
      if (k == '0') return;
      args.push(_arguments[k]);
    });
  } else {
    caller = objective.getCaller(1,true);
  }
  if (caller) {
    error('at - (%s:%s:%s)', caller.file, caller.line, caller.colm);
  }
  error.apply(this, args);
}

module.exports.error.pend = function(depth) {
  // async often means lost stack for error
  var caller, args = arguments, _arguments = arguments;
  if (!isNaN(depth)) {
    args = [];
    if (depth >= 0) caller = objective.getCaller(depth,true);
    Object.keys(arguments).forEach(function(k) {
      if (k == '0') return;
      args.push(_arguments[k]);
    });
  } else {
    caller = objective.getCaller(1,true);
  }
  return {
    trigger: function() {
      if (caller) {
        error('at - (%s:%s:%s)', caller.file, caller.line, caller.colm);
      }
      error.apply(this, args);
    }
  }
}

module.exports.TODO = function() {
  var last;
  var args = [];
  for (key in arguments) {
    args.push(arguments[key]);
  }
  var file = objective.getCaller(1, true).file;
  args.push(file);
  TODO.apply(this, args);
}

module.exports.createDebug = function(name) {
  //if (debugs[name] !== 'undefined') return debugs[name];
  debugs[name] = debug('debug:' + name);
  return function() {
    debugs[name].apply(this, arguments);
  }
}

module.exports.setStream = function(s) {
  debug.setStream(s);
}
