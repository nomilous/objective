// plugins require $$name

module.exports.$$name = 'example'

module.exports.create = function(root, config, callback) {

  // callback with (err, thePluginInstance)
  // 
  // 'root'   - the objective root that is initializing this plugin
  // 'config' - the portion of config specific to this plugin

  var pluginInstance, interval, message;
  
  message = config.defaultMessage;
  

  objective.pipeline.on('prompt.commands.register.ask', function(command, next) {

    // not calling next will be an issue, pipelines are middleware(ish)

    // create commands accessable from the objective prompt.

    command.create('setMessage', {
      description: 'Reset message.',
      run: function(args, callback) {
        message = args.join(' ');
        // MUST! callback. The prompt is waiting
        //                 Pending strategy to bg commands
        callback();
      }
    });

    command.create('stopMessage', {
      description: 'Stop message.',
      run: function(args, callback) {
        if (interval) {
          clearInterval(interval);
          interval = void 0;
        }
        callback();
      }
    });

    command.create('startMessage', {
      description: 'Start message.',
      run: function(args, callback) {
        if (interval) {
          return callback(new Error('Already started.'))
        }
        pluginInstance.start();
        callback();
      }
    });


    command.create('autoCompletable', {
      description: 'Short help.',
      help: 'Detailed help',
      run: function(args, callback) {
        callback(null, {result: args});
      },
      autoComplete: function(args, callback) {
        callback(null, ['an', 'amicable', 'amity']);
      }
    });

    command.create('cat', {
      description: 'Concatenate files. Print to console.',
      run: function(args, callback) {
        try {
          // write to the objective console, not the remote repl
          args.forEach(function(arg) {
            console.log(require('fs').readFileSync(arg).toString())
          });
        } catch (e) {
          return callback(e, null);
        }
        callback();
      },
      autoComplete: function(args, callback) {
        callback(null, {type: 'path',});
      }
    });

    next();  // if next was not declared in the args, that's ok too.

  });

  // create the instance of the plugin functionality to
  // be accessable in the objective function

  pluginInstance = {
    start: function() {
      interval = setInterval(function() {
        console.log('message: %s', message);
      }, 1000);
    }
  }

  callback(null, pluginInstance);


}