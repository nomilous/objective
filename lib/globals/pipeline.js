
var ref = require('also'), ref1 = objective.logger
  , generate = require('shortid').generate
  , deferred = ref.deferred
  , pipeline = ref.pipeline
  , Pipeline
  , count = 0
  , debug = ref1.createDebug('pipeline')
  , TODO = ref1.TODO
  , error = ref1.error
  , info = ref1.info

TODO('report on hung pipes at program exit');

TODO('queued pipeline');



process.on('SIGINT', function() {
  if (objective.program.attach) return process.exit(0)
  count++
  setTimeout(function(){
    count--
  }, 2000);
  if (count > 1) return process.exit(1);
  for (id in Pipeline.runs) {
    var event, payload, depth, runningHandler;
    event = Pipeline.runs[id].event;
    payload = Pipeline.runs[id].payload;
    depth = Pipeline.runs[id].depth;
    caller = Pipeline.runs[id].caller;
    runningHandler = Pipeline.runs[id].runningHandler;
    debug('still in pipeline', event, depth, caller)
    debug('payload', payload);
    debug('function', runningHandler);
  }
  console.log('\n^c again to exit.');
  //console.log(Pipeline.runs);

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
            Pipeline.runs[id].runningHandler = fn
            Pipeline.runs[id].caller = caller;
            Pipeline.runs[id].depth++
            debug("pipeline event handler running event '" + event + "'");
            return objective.injector({
              args: [payload],
              next: action.resolve,
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

  on: function(event, fn) {
    var base;
    if (typeof Pipeline.pipes[event] === 'undefined') {
      error("No such event '" + event + "'");
      throw new Error("No such event '" + event + "'");
    }
    debug("pipeline registering handler on event '" + event + "'");
    (base = Pipeline.pipes)[event] || (base[event] = []);
    return Pipeline.pipes[event].push({
      fn: fn,
      caller: objective.getCallerFileName(2)
    });
  }
};

