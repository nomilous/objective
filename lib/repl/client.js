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
  sock.pipe(process.stdout)

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