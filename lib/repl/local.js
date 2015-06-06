var Repl = require('repl')
  , running
  , repl
  , devnull = require('dev-null')
  ;


module.exports.start = function(root) {

  if (running) return;
  if (!process.stdout.isTTY) return;

  running = true

  var prompt = (
      root.config.package 
      ? root.config.package.name + '-' + root.config.package.version
      : root.config.codename || root.config.title
  ) + '> ';

  repl = Repl.start({
    prompt: prompt,
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    useGlobal: true
  });

  Object.defineProperty(repl.context, 'tools', {
    enumerable: true,
    get: function() {
      var origEval = repl.eval;
      repl.eval = function() {};
      // repl.input = devnull();
      repl.output = devnull();
      objective.prompt.start(function(){
        repl.eval = origEval;
        repl.input = process.stdin;
        repl.output = process.stdout;
        console.log('gone');
      });
      return;
    }
  });

}

module.exports.stop = function() {
  // repl.close();
  if (repl) {
    repl.output = devnull();
    repl.eval = function(){};
  }
}
