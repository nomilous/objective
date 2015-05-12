// Generated by CoffeeScript 1.9.2
var client, user;

user = require('./user');

client = require('socket.io-client');

user.load();

module.exports = {
  connect: function(objective, callback) {
    var key, socket;
    key = user.key;
    socket = client('https://ipso.io');
    socket.on('connect_error', function(e) {
      return console.log('connect error', e.toString());
    });
    socket.on('connect_timeout', function() {
      return console.log('timeout');
    });
    socket.on('connect', function() {
      return socket.emit('auth', {
        objective: objective,
        key: key
      });
    });
    socket.on('reconnect', function(n) {
      return console.log('reconnected ' + n);
    });
    socket.on('reconnect_attempt', function() {
      return console.log('reconnect attempt');
    });
    socket.on('reconnecting', function(n) {
      return console.log('reconnecting ' + n);
    });
    socket.on('reconnect_error', function(e) {
      return console.log('reconnect error', e.toString());
    });
    socket.on('reconnect_failed', function() {
      return console.log('reconnect failed after reconnectionAttempts');
    });
    socket.on('auth.good', function(arg) {
      var online_users;
      online_users = arg.online_users;
      return console.log("online now: " + (JSON.stringify(online_users)));
    });
    socket.on('auth.bad', function() {
      return callback(new Error('Bad key or objective uuid.'));
    });
    return socket.on('auth.err', function(e) {
      return callback(e);
    });
  }
};