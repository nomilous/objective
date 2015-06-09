
var ref1 = objective.logger
  , generate = require('shortid').generate
  , pipeline
  , sequence = require('when/sequence')
  , promise = require('when').promise
  , count = 0
  , debug = ref1.createDebug('pipeline')
  , TODO = ref1.TODO
  , error = ref1.error
  , warn = ref1.warn
  , info = ref1.info

function exitWarning() {
  for (id in pipeline.runs) {
    var event, payload, depth, runningHandler;
    event = pipeline.runs[id].event;
    payload = pipeline.runs[id].payload;
    depth = pipeline.runs[id].depth;
    caller = pipeline.runs[id].caller;
    runningHandler = pipeline.runs[id].runningHandler;
    warn('still in pipeline');
    warn('at %s:%d:%d', caller.file, caller.line, caller.col);
    warn('event:%s depth:%s, payload', event, depth, payload);
    warn('');
    //warn('function', runningHandler);
  }
}

process.on('exit', function() {
  if (count == 0) exitWarning();
});

process.on('SIGINT', function() {
  if (objective.program.attach) return process.exit(0)
  count++;
  setTimeout(function(){
    count--
  }, 2000);
  if (count > 1) return process.exit(1);
  exitWarning();
  console.log('\nagain to exit');
});

module.exports = pipeline = {

  pipes: {},

  runs: {},

  startRun: function(event, payload) {
    var id = generate();
    pipeline.runs[id] = {
      event: event,
      payload: payload,
      depth: 0,
      runningHandler: null,
      caller: null
    }
    return id;
  },

  createEvent: function(event) {
    var base;
    debug("pipeline created event '" + event + "'");
    return (base = pipeline.pipes)[event] || (base[event] = []);
  },

  emit: function(event, payload, callback) {
    var id, cancelled, cancelledReason, fn, pipe;
    if (!(pipe = pipeline.pipes[event])) {
      return callback(new Error("No handlers for '" + event + "'."));
    }
    debug("pipeline emitting event '" + event + "'");
    id = pipeline.startRun(event, payload);
    cancelled = false;
    cancelledReason = 'reason unspecified';
    return sequence(
      pipe.map(function(handler){
        return function() {
          return promise(function(resolve, reject){
            pipeline.runs[id].runningHandler = handler.fn;
            pipeline.runs[id].caller = handler.caller;
            pipeline.runs[id].depth++;
            debug("pipeline event handler '%s' running event '%s'", handler.opts.label, event);
            return objective.injector({
              args: [payload],
              next: function(e) {
                // TODO, is it error?
                if (e) return reject(e);
                resolve();
              },
              onError: reject,
              cancel: function(reason) {
                if (reason != null) {
                  cancelledReason = reason;
                }
                cancelled = true;
                return reject();
              }
            }, handler.fn);
          });
        }
      })
    ).then(function(result) {
      debug("pipeline event '" + event + "' done ok");
      delete pipeline.runs[id];
      return callback(null, payload);
    }, function(err) {
      var depth, fn;
      depth = pipeline.runs[id].depth;
      fn = pipeline.runs[id].runningHandler;
      if (cancelled) {
        debug("event cancelled at depth " + depth + " by ", fn);
        info("pipeline event '" + event + "' cancelled because '" + cancelledReason + "'");
        delete pipeline.runs[id];
        return;
      }
      console.log(err.stack);
      debug("event failed at depth " + depth + " by ", fn, err);
      error("pipeline event '" + event + "' failed " + (err.toString()));
      delete pipeline.runs[id];
      return callback(err);
    }, function(notify) {});
  },
                        // optional
                       //
  on: function(event, opts, fn, anyway) {
                                  //
                                 // does not exist yet, subscribe anyway
    var _arguments = arguments;
    var args = Object.keys(arguments).map(function(key){return _arguments[key]});
    event = args.shift();
    opts = args.shift();
    if (typeof opts == 'string') opts = {label:opts};
    if (typeof opts == 'function') {
      fn = opts;
      anyway = args.shift();
      opts = {label:'untitled'};
    } else {
      fn = args.shift();
      anyway = args.shift();
    }

    if (fn.$$pipeid) return fn.$$pipeid;
    Object.defineProperty(fn, '$$pipeid', {
      enumareble: false,
      configurable: false,
      writable: false,
      value: generate()
    });

    var base;
    if (typeof pipeline.pipes[event] === 'undefined' && !anyway) {
      error("No such event '" + event + "'");
      throw new Error("No such event '" + event + "'");
    }
    debug("pipeline registering handler on event '" + event + "'");
    (base = pipeline.pipes)[event] || (base[event] = []);
    pipeline.pipes[event].push({
      opts: opts,
      fn: fn,
      caller: objective.getCaller(2)
    });
    return fn.$$pipeid;
  },

  off: function(event, fn) {
    // deleted handlers may still still be called by any
    // already (long) running emits (TODO: fix) 
    var deleteId = fn.$$pipeid;
    pipeline.pipes[event] = pipeline.pipes[event].filter(
      function(handler) {
        return handler.fn.$$pipeid != deleteId;
      }
    );
    delete fn.$$pipeid;
  }
};

