
var ref = require('also'), ref1 = objective.logger
  , generate = require('shortid').generate
  , deferred = ref.deferred
  , pipeline = ref.pipeline
  , Pipeline
  , count = 0
  , debug = ref1.createDebug('pipeline')
  , TODO = ref1.TODO
  , error = ref1.error
  , warn = ref1.warn
  , info = ref1.info

function exitWarning() {
  for (id in Pipeline.runs) {
    var event, payload, depth, runningHandler;
    event = Pipeline.runs[id].event;
    payload = Pipeline.runs[id].payload;
    depth = Pipeline.runs[id].depth;
    caller = Pipeline.runs[id].caller;
    runningHandler = Pipeline.runs[id].runningHandler;
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

module.exports = Pipeline = {

  pipes: {},

  runs: {},

  startRun: function(event, payload) {
    var id = generate();
    Pipeline.runs[id] = {
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
    return (base = Pipeline.pipes)[event] || (base[event] = []);
  },

  emit: function(event, payload, callback) {
    var id, cancelled, cancelledReason, fn, pipe;
    if (!(pipe = Pipeline.pipes[event])) {
      return callback(new Error("No handlers for '" + event + "'."));
    }
    debug("pipeline emitting event '" + event + "'");
    id = Pipeline.startRun(event, payload);
    cancelled = false;
    cancelledReason = 'reason unspecified';
    return pipeline((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = pipe.length; i < len; i++) {
        fn = pipe[i].fn;
        caller = pipe[i].caller;
        results.push((function(fn, caller) {
          return deferred(function(action) {
            Pipeline.runs[id].runningHandler = fn;
            Pipeline.runs[id].caller = caller;
            Pipeline.runs[id].depth++;
            debug("pipeline event handler running event '" + event + "'");
            return objective.injector({
              args: [payload],
              next: function(e) {
                // TODO, is it error?
                // could instead resolve with result
                if (e) return action.reject(e);
                action.resolve();
              },
              onError: action.reject,
              cancel: function(reason) {
                if (reason != null) {
                  cancelledReason = reason;
                }
                cancelled = true;
                return action.reject();
              }
            }, fn);
          });
        })(fn, caller));
      }
      return results;
    })()).then(function(result) {
      debug("pipeline event '" + event + "' done ok");
      delete Pipeline.runs[id];
      return callback(null, payload);
    }, function(err) {
      var depth, fn;
      depth = Pipeline.runs[id].depth;
      fn = Pipeline.runs[id].runningHandler;
      if (cancelled) {
        debug("event cancelled at depth " + depth + " by ", fn);
        info("pipeline event '" + event + "' cancelled because '" + cancelledReason + "'");
        delete Pipeline.runs[id];
        return;
      }
      console.log(err.stack);
      debug("event failed at depth " + depth + " by ", fn, err);
      error("pipeline event '" + event + "' failed " + (err.toString()));
      delete Pipeline.runs[id];
      return callback(err);
    }, function(notify) {});
  },

  on: function(event, fn, anyway) {
                          // does not exist yet, subscribe anyway
    if (fn.$$pipeid) return fn.$$pipeid;
    fn.$$pipeid = generate();
    var base;
    if (typeof Pipeline.pipes[event] === 'undefined' && !anyway) {
      error("No such event '" + event + "'");
      throw new Error("No such event '" + event + "'");
    }
    debug("pipeline registering handler on event '" + event + "'");
    (base = Pipeline.pipes)[event] || (base[event] = []);
    Pipeline.pipes[event].push({
      fn: fn,
      caller: objective.getCaller(2)
    });
    return fn.$$pipeid;
  },

  off: function(event, fn) {
    // deleted handlers may still still be called by any
    // already (long) running emits (TODO: fix) 
    var deleteId = fn.$$pipeid;
    Pipeline.pipes[event] = Pipeline.pipes[event].filter(
      function(handler) {
        return handler.fn.$$pipeid != deleteId;
      }
    );
    delete fn.$$pipeid;
  }
};

