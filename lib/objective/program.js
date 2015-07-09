
var 
    fs = require('fs')
  , EOL = require('os').EOL
  , path = require('path')
  , debug = objective.logger.createDebug('program')
  , error = objective.logger.error
  , program = require('commander')
  , promise = require('when').promise
  , sequence = require('when/sequence')
  , pipeline = require('./globals/pipeline')
  , localRepl = require('./repl/local')
  , testing = process.env.TESTING_OBJECTIVE_SELF == '1' ? true : false
  ;

pipeline.createEvent('multiple.objectives.done');

program
.version(JSON.parse(require('fs').readFileSync(__dirname + '/../../package.json')).version)
// .usage('[options] files/*')

.option('')
.option('--create',             'Create new objective.')
.option('--create-dev',         'Create new objective with dev template.')
.option('--template [name]',    'Create objective from template.')
.option('--json',               'Create objective with config in associated json file.')
.option('--js',                 'Create objective as javascript (default coffee)')
.option('')
.option('--root [file]',        'Run root objective from file. (name part)')
.option('--attach',             'Attach to running objective. (per repl in config)')
.option('')
.option('--once',               'Informs repeating/continuous objectives to only run one loop.')

module.exports = program;

module.exports.start = function() {

  program.parse(process.argv);

  program.once = program.rawArgs.indexOf('--once') >= 0;

  var possibleRoots = ['./objective.coffee', './objective.js'];

  var runRoot = function(filename) {
    var waiting;
    // can only run in current directory
    filename = path.normalize(process.cwd() + path.sep + filename);
    debug('starting with root file', filename);

    try {
      require(filename);
      objective.noRoot = false;
      waiting = objective.rootWaiting;
      debug(-1, 'got child waiting', waiting);
      
      if (!waiting && !program.attach) {
        error(-1, 'not objective', filename);
        process.exit(1);
      }

      waiting.then(
        function(result) {
          if (objective.roots[0].config.once) {
            process.exit(objective.roots[0].exitCode || 0);
          }
        },
        function(err) {
          error(-1, err.toString());
          process.exit(error.errno || 1);
        },
        function(notify) {
          if (notify.event == 'starting') {
            if (!objective.roots[0].config.once) {
              // TODO make optional
              localRepl.start(notify.root);
            }
          }
        }
      );
    } catch(e) {
      error(-1, 'failed starting root', EOL, e.stack);
      process.exit(1);
    }
  }

  if (program.register) {
    program.stop = true
    return require('./actions/register').do(program, false, function(){})
  }

  else if (program.reset) {
    program.stop = true
    return require('./actions/register').do(program, true, function(){})
  }

  else if (program.create) {
    program.stop = true
    return require('./actions/create').do(program, function(){})
  }

  else if (program.createDev) {
    program.stop = true
    program.template = 'dev'
    return require('./actions/create').do(program, function(){})
  }

  else if (typeof program.root !== 'undefined' && program.root !== null) {
    if (typeof program.root == 'boolean') {
      program.stop = true
      error(-1, '--root requires [file]');
      return;
    }
    runRoot(program.root);
  }

  else if(program.args.length > 0) {
    if (testing) return;
    debug('running multiple objectives');
    // TODO, ability to run root and list of childs 
    // TODO, got root? do that first
    objective.noRoot = true

    return sequence( program.args.map( function(arg) {
      return function() {
        return promise( function(resolve, reject) {
          var waiting;

          // loading multiple child objectives from commandline args
          // one at a time...

          // TODO, got root? use roots promise?

          // assume arg files relative to cwd (for now)

          moduleFileName = process.cwd() + path.sep + arg;

          debug("loading child at file", moduleFileName);

          try {

            require(moduleFileName);
            waiting = objective.childWaiting;

            debug('got child waiting', waiting);

            if (!waiting) { 
              error(-1, 'arg: ' + arg + ' is not objective');
              return resolve();
            }

            // the child is loading/running...

            waiting.then(
              function(res) {
                debug('arg objective resolved', res);
                // TODO these results accumulate for final test result
                resolve();
              },
              function(err){
                error(-1, 'arg objective rejected', err);
                resolve();
              }
            );

          } catch (e) {

            error(-1, 'in loading objective from ' + moduleFileName, e);
            resolve(); // allow next arg
          }
          
        });
      }
    })).then(
      function(res) {
        
        debug('final arg result', res);

        pipeline.emit('multiple.objectives.done', {
          result: res,
          error: null
        }, function(err, after) {
          var exitCode = (after.exitCode || 0);
          process.exit(exitCode);
        });

      },
      function(err) {
        error(-1, 'in loading child objectives', err);
        process.exit(1);
      }
    );
  } else {
    
    foundRoots = possibleRoots.filter(function(filename){
      try {
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) return false;
        return true;
      } catch(e) {
        return false;
      }
    });

    var cli = false;
    var e = new ObjectiveError();
    e.frames.forEach(function(frame) {
      if (frame.file.match(new RegExp('bin'+path.sep+'objective$')) 
       || frame.file.match(new RegExp('bin'+path.sep+'o.$')))
        cli = true;
    });

    if (cli && foundRoots.length == 0) {
      error(-1, 'Nothing to do.');
      process.exit(1);
    }

    else if (foundRoots.length > 1) {
      error(-1, 'Too many roots.', foundRoots);
      process.exit(1);
    }

    else {
      // Fall back to found root only if called from bin/objective
      if (cli) runRoot(foundRoots[0]);
    }
  }
};

