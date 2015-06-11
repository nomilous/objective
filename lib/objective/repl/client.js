module.exports.connect = function(config) {

  try {
    config.repl.listen;
  } catch(e) {
    console.log(
'\nMissing config.repl.listen' + 
'\n' +
'\neg.' +
'\n' +
'\nobjective(\'Title\', {' +
'\n    other: \'config\',' +
'\n    repl: { listen: \'/tmp/socket-objective-title-whatevvr\' }'  +
'\n}, function() {' +
'\n' +
'\n});'

)
    return;
  }

  var net = require('net');
   
  var sock = net.connect(config.repl.listen);

  console.log('connecting to %s', config.repl.listen);

  process.stdin.pipe(sock)
  // sock.pipe(process.stdout)
  sock.on('data',function(data){

    // lazy hack to get clearLine and cursorTo across the socket

    var string = data.toString();

    var match1 = string.match(/_clearLine_/);
    if (match1) {
      process.stdout.clearLine();
      string = string.replace(/_clearLine_/g, '');
    }

    var match2 = string.match(/_cursorTo_(\d+)_/g);
    if (match2) {
      match2.forEach(function(match){
        var n = parseInt(match.split('_')[2]);
        var parts = string.split(match);
        process.stdout.write(parts.shift());
        process.stdout.cursorTo(n);
        string = parts.join(match);
      });
    }

    if (match1 || match2) {
      process.stdout.write(string);
    } else {
      process.stdout.write(data);
    }
  });

  sock.on('error', function(err) {
    console.log(err);
  })
   
  sock.on('connect', function () {
    process.stdin.setRawMode(true)
  })
   
  sock.on('close', function done () {
    process.stdin.setRawMode(false)
    // process.stdin.pause()
    sock.removeListener('close', done);
    console.log('\nclosed!');
    process.exit(0);
  })
   
  process.stdin.on('end', function () {
    sock.destroy()
    console.log()
  })
   
  process.stdin.on('data', function (b) {
    if (b.length === 1 && b[0] === 4) {
      process.stdin.emit('end')
    }
  })

}