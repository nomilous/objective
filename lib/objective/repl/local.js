var Repl = require('repl')
  , devnull = require('dev-null')
  ;


module.exports.start = function(root) {

  if (objective.localRepl) return;
  if (!process.stdout.isTTY) return;

  console.log('starting');

  var prompt = (
      root.config.package 
      ? root.config.package.name + '-' + root.config.package.version
      : root.config.codename || root.config.title
  ) + '> ';

  var repl = Repl.start({
    prompt: prompt,
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    useGlobal: true
  });

  Object.defineProperty(repl.context, 'tools', {
    enumerable: true,
    configurable: true,
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

  objective.localRepl = repl;

}

module.exports.stop = function() {
  // repl.close(); // ?
  if (objective.localRepl) {
    objective.localRepl.output = devnull();
    objective.localRepl.eval = function(){};
    delete objective.localRepl;
  }
}
