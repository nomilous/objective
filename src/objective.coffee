# process.env.DEBUG = 'info,error' unless process.env.DEBUG?
process.env.DEBUG = 'info,error,TODO' unless process.env.DEBUG?

# {deferred, pipeline, util, When} = require 'also'

{defer} = require 'when'

{info, debug, error, TODO} = require './logger'

TODO 'fail on multiple objectives in one file, even nested'
TODO 'exit codes, and after recurse for all test results'
TODO 'add flag to not queue child objectives'
TODO 'per module debug'
TODO 'config into json appendage'

pipe = require './globals/pipeline'
pipe.createEvent 'objective.result'
pipe.createEvent 'objective.notify'
# pipe.createEvent 'objective.queued'
TODO 'queue objective in here, not in recursor and cli'

# {enque} = require('./globals/queue').create 'objectives'

child = require './objective_child'

init = require './objective_init'

path = require 'path'

fs = require 'fs'


# uuid = require 'uuid'

# required = {}

# run = undefined # promise of a currently running child objective

# deferrals = [] # running multiple objectives (without root)

module.exports = Objective = (args...) ->

    title = args[0]

    config = args[1]

    callback = args[2]

    if typeof title == 'string'

        if typeof config == 'object'

            config.title = title

        if typeof config == 'undefined'

            config = title: title

        if typeof config == 'function'

            callback = config

            config = title: title

    if typeof title == 'object'

        if typeof config == 'function'

            config = title

            callback = config

    if typeof title == 'function'

        callback = title

        config = {}

    config.title = 'Untitled Objective' unless config.title?

    return child.load config, callback if objective.node? or objective.noRoot




    # running root objective

    objective.node = config

    objectiveFn = ->

    init.globals()

    .then -> init.user config

    .then -> init.plugins config

    .then -> run config, objectiveFn

    .catch (e) ->

        console.log e.stack
        process.exit 1
    
    return run: (fn) ->

        caller = objective.getCallerFileName 2

        caller = caller.replace process.cwd() + path.sep, ''

        if path.dirname(caller) != '.'

            console.log 'Must run objective in current directory (for now)'
            process.exit 1

        objectiveFn = fn


run = (config, objectiveFn) ->

    required = {}

    required[filename] = {} for filename of require.cache

    clearRequire = ->

        for filename of require.cache

            continue if required[filename]?

            delete  require.cache[filename]

            debug "Removed #{filename} from require cache"


    if objectiveFn.toString() == 'function () {}'

        console.log 'Nothing to do.'

        process.exit 0


    running = objective.injector {}, objectiveFn
    
    if running? and running.then? and typeof running.then == 'function'

        running.then(

            (result) -> pipe.emit 'objective.result', error: null, result: result, ->

            (error) -> pipe.emit 'objective.result', error: error, result: null, ->

            (notify) -> pipe.emit 'objective.notify', message: notify, ->

        )

        running.start() if running.start? and typeof running.start == 'function'


Object.defineProperty global, 'objective',

    get: -> Objective

    configurable: false


Object.defineProperty objective, 'waiting',
    
    get: -> child.nextPromise()

    configurable: false


Object.defineProperty objective, 'getCallerFileName',

    get: -> (depth) ->

        origPrepareStackTrace = Error.prepareStackTrace

        Error.prepareStackTrace = (_, stack) -> stack

        stack = (new Error).stack

        Error.prepareStackTrace = origPrepareStackTrace

        return stack[depth].getFileName()

    configurable: false


program = require './cli'

objective.logger = require './logger'

program.start()

