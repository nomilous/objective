
var 
    fs = require('fs')
  , path = require('path')
  , debug = objective.logger.createDebug('program')
  , error = objective.logger.error
  , program = require('commander')
  , promise = require('when').promise
  , sequence = require('when/sequence')
  , pipeline = require('./globals/pipeline')

pipeline.createEvent('multiple.objectives.done');

program
.version(JSON.parse(require('fs').readFileSync(__dirname + '/../package.json')).version)
// .usage('[options] files/*')

.option('')
.option('--create',             'Create new objective.')
.option('--template [name]',    'Create objective from template.')
.option('--json',               'Create objective with config in associated json file.')
.option('--js',                 'Create objective as javascript (default coffee)')
.option('')
.option('--root [file]',        'Run root objective from file. (name part)')
// .option('--register',        'Register new user.')
// .option('--reset',           'Re-register as existing user by email (forgot password).')
// .option('--create-dev',      'Create new dev objective.')
// .option('--template [name]', 'Create new objective from template')
// .option('--private',         'To create objective as private.')
// .option('--force',           'Force action.')
// .option('--js',              'Use javascript for --create.')
// .option('--recurse [dir]',   'Recurse directory for child objectives.')
// .option('--run',             'Run child objectives. (from --recurse)')
// .option('--prompt',          'Proceed to prompt, skipping run')
// .option('--offline',         'Run offline.')
.option('--attach',              'Attach to running objective. (per repl in config)')

module.exports = program;

module.exports.start = function() {

  program.parse(process.argv);

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
      debug('got child waiting', waiting);
      
      if (!waiting && !program.attach) {
        error('not objective', filename);
        process.exit(1);
      }


    } catch(e) {
      error('failed starting root', e, e.stack);
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
      error('--root requires [file]');
      return;
    }
    runRoot(program.root);
  }

  else if(program.args.length > 0) {
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
              error('arg: ' + arg + ' is not objective');
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
                error('arg objective rejected', err);
                resolve();
              }
            );

          } catch (e) {

            error('in loading objective from ' + moduleFileName, e);
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
        error('in loading child objectives', err);
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
        // if (e.errno != 34) { // they changed it.
        //   error("error reading file ", filename, e);
        // }
        return false;
      }
    });

    if (foundRoots.length == 0) {
      error('Nothing to do.');
      process.exit(1);
    }

    else if (foundRoots.length > 1) {
      error('Too many roots.', foundRoots);
      process.exit(1);
    }

    else {
      runRoot(foundRoots[0]);
    }
  }
};

