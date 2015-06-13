if (typeof OriginalError === 'undefined') {

  global.OriginalError = Error;

  function ExpandedError() {

    var frames, e = OriginalError.apply(this, arguments);

    Object.defineProperty(this, 'name',    {value: 'Error', configurable: true})
    Object.defineProperty(this, 'message', {value: e.message, configurable: true})
    Object.defineProperty(this, 'frames',  {get:function(){return frames}, configurable: true});
    Object.defineProperty(this, 'stack',   {get:function() {return e.stack}, configurable: true});
    
    var origPrepareStackTrace = OriginalError.prepareStackTrace;
    OriginalError.prepareStackTrace = function(e, stack){return stack;}
    try {
      frames = OriginalError.apply(this, arguments).stack.map(function(frame){
        return {
          native: frame.isNative(),
          file: frame.getFileName(),
          line: frame.getLineNumber(),
          colm: frame.getColumnNumber(),
          fn: frame.getFunction(),

          frame: frame
          // https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi
          //
          // frame.getThis:         returns the value of this
          // frame.getTypeName:     returns the type of this as a string. This is the name of the 
          //                        function stored in the constructor field of this, if available, 
          //                        otherwise the object's [[Class]] internal property.
          // frame.getFunction:     returns the current function
          // frame.getFunctionName: returns the name of the current function, typically its name property. 
          //                        If a name property is not available an attempt will be made to try to 
          //                        infer a name from the function's context.
          // frame.getMethodName:   returns the name of the property of this or one of its prototypes that 
          //                        holds the current function
          // frame.getFileName:     if this function was defined in a script returns the name of the script
          // frame.getLineNumber:   if this function was defined in a script returns the current line number
          // frame.getColumnNumber: if this function was defined in a script returns the current column number
          // frame.getEvalOrigin:   if this function was created using a call to eval returns a CallSite object 
          //                        representing the location where eval was called
          // frame.isToplevel:      is this a toplevel invocation, that is, is this the global object?
          // frame.isEval:          does this call take place in code defined by a call to eval?
          // frame.isNative:        is this call in native V8 code?
          // frame.isConstructor:   is this a constructor call?
          //
        }
      });
      frames.shift();  // Don't need original error constructor.
      frames.shift(); // Don't need this extended constructor.
                     // frame[0] is now the caller to error
    } finally {
      OriginalError.prepareStackTrace = origPrepareStackTrace;
    }
    return this;
  }

  ExpandedError.prototype = Error.prototype;
  ExpandedError.prototype.constructor = ExpandedError;

  Object.defineProperty(ExpandedError, 'prepareStackTrace', {
    enumarable: false,
    get: function() {
      return OriginalError.prepareStackTrace;
    },
    set: function(value) {
      OriginalError.prepareStackTrace = value;
    }
  });
  ExpandedError.stackTraceLimit = Error.stackTraceLimit;
  ExpandedError.captureStackTrace = function(error, constructorOpt) {
    OriginalError.captureStackTrace(error, constructorOpt);
  }

  global.ExpandedError = ExpandedError;
  global.Error = ExpandedError;

}
