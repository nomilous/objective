# process.env.DEBUG = 'info,error' unless process.env.DEBUG?
process.env.DEBUG = 'info,error,TODO' unless process.env.DEBUG?

{deferred, pipeline, util, When} = require 'also'

{info, debug, error, TODO} = require './logger'

TODO 'exit codes, and after recurse for all test results'
TODO 'add flag to not queue child objectives'
TODO 'per module debug'
TODO 'config into json appendage'

pipe = require './globals/pipeline'
pipe.createEvent 'objective.result'
pipe.createEvent 'objective.notify'
pipe.createEvent 'objective.queued'

{enque} = require('./globals/queue').create 'objectives'

path = require 'path'

fs = require 'fs'

uuid = require 'uuid'

required = {}

run = undefined # promise of a currently running child objective

module.exports = Objective = (config = {}) ->

    running = null  # the promise of the root objective

    if typeof config == 'string'

        title = config

        config = arguments[1] || {}

        config.title = title

    if objective.root?

        if objective.root.children[config.uuid]?

            oldConfig = objective.root.children[config.uuid].root

            objective.prompt.startbg()

            debug "Updating '#{config.title}' from '#{oldConfig.filename}'"

            config.filename = oldConfig.filename

            objective.root.children[config.uuid] = root: config

            objective.root.children[config.uuid].doRun = true

        else

            config.filename = objective.loading

            info "Loading '#{config.title}' from '#{config.filename}'"

            objective.root.children[config.uuid] = root: config


        # run, for child objectives

        return run: (fn) ->

            run = When.defer()

            objective.root.children[config.uuid].run = fn

            return run.resolve() unless program.run or objective.root.children[config.uuid].doRun

            TODO 'flag to disable require cache flushing'

            for moduleFile of require.cache

                continue if required[moduleFile]

                delete require.cache[moduleFile]

            info "Running '#{config.title}' from '#{config.filename}'"
            
            try

                for name of objective.plugins

                    try objective.plugins[name].before config

                childRunning = fn()

                if childRunning? and typeof childRunning.then is 'function'

                    childRunning.then(

                        (result) ->

                            debug objective_result: result

                            pipe.emit 'objective.result', error: null, result: result, ->
                                
                                objective.prompt.endbg()
                                run.resolve()

                        (err) -> 

                            error objective_error: err

                            pipe.emit 'objective.result', error: err, result: null, ->
                                
                                objective.prompt.endbg()
                                run.resolve()

                        (message) ->

                            debug objective_notify: notify

                            pipe.emit 'objective.notify', message: message,  ->

                                run.resolve()
                            
                    )

                    childRunning.start() if typeof childRunning.start is 'function'

                else

                    objective.prompt.endbg()
                    run.resolve()
                    # done()

            catch e

                error e.stack + '\n'
                run.resolve()
                # done()


    objective.root = config

    objective.root.children ||= {}

    run = (e) ->

        console.log 'Missing .run(fn)'
        console.log e.toString() if e?

    loadGlobal = (name, path) ->

        if objective[name]?

            info "Warning: global #{name} not loaded."
            return

        debug "Loading global 'objective.#{name}'"
        objective[name] = require path
        objective.coffee.register() if name == 'coffee'
        objective.globals ||= []
        objective.globals.push name

    TODO 'repeat() global'

    loadGlobal 'recurse', './globals/recurse'
    loadGlobal 'coffee', 'coffee-script'
    loadGlobal 'uplink', './globals/uplink'
    loadGlobal 'prompt', './globals/prompt'
    loadGlobal 'pipe', './globals/pipeline'
    loadGlobal 'injector', './globals/injector'
    loadGlobal 'queue', './globals/queue'


    # plugins should be initialized asyncronously via plugin.init()
    
    config.plugins ||= []

    objective.plugins ||= {}

    count = 1

    pipeline(

        for moduleName in config.plugins

            do (moduleName) -> 

                deferred ({resolve, reject}) ->

                    unless typeof moduleName == 'string'

                        unless moduleName.name

                            moduleName.name = "plugin#{count++}"

                            info "Warning: Plugin without name. (set .name property)"

                        if global[moduleName.name]? 

                            return reject new Error "Plugin #{moduleName} collides with global.#{moduleName.name}"

                        info "Loading plugin '#{moduleName}' as '#{moduleName.name}'"

                        global[moduleName.name] = moduleName
                        
                        try

                            moduleName.init (e) ->

                                error "Failed loading plugin '#{moduleName.name}'" if e?

                                return reject e if e?

                                resolve()

                        catch e

                            error "Failed loading plugin '#{moduleName.name}'"

                            return reject e

                        return

                    name = moduleName.split(path.sep).pop().replace /objective-/, ''

                    if name.match /[-\._]/

                        parts = name.split /[-\._]/

                        camel = parts[0]

                        for i in [1..parts.length - 1]

                            p = parts[i][0].toUpperCase()

                            camel += p + parts[i][1..]

                        name = camel

                    if global[name]? 

                        return reject new Error "Plugin #{moduleName} collides with global.#{name}"

                    try

                        if moduleName.match /^\./

                            moduleName = path.normalize process.cwd() + path.sep + moduleName

                        global[name] = require moduleName

                    catch e

                        return reject e

                    info "Loading plugin '#{moduleName}' as '#{name}'"

                    try

                        global[name].init (e) ->

                            error "Failed loading plugin '#{name}'" if e?

                            return reject e if e?

                            objective.plugins[name] = global[name]

                            resolve()

                    catch e

                        error "Failed loading plugin '#{name}'"

                        return reject e


    ).then(

        (result) ->

            TODO 'promises after run to emit'

            process.nextTick ->

                # remember all cached modules before running to allow flushing
                # all but the starting modules at next run

                required[filename] = {} for filename of require.cache

                TODO 'Handle recursing, get root promise (running) first (or something)'
                TODO 'Or remove --recurse (similar needed for test all silently'

                if program.recurse?

                    unless typeof program.recurse is 'string'

                        info "\nRecurse needs [dir]"
                        return

                    dir = program.recurse

                    return objective.recurse dir, (err) ->

                        return run err if err?

                        run null

                return objective.prompt() if program.prompt

                running = objective.injector {}, run

        (err) ->

            if program.prompt

                error err.stack
                program.exit 1

            process.nextTick ->

                # injector injects error into run if run accepts it (per arguments)

                running = objective.injector error: err, run
                
                process.exit 1 unless running? and typeof running.then is 'function'


    )

    # for moduleName in config.plugins

    #     if typeof moduleName == 'string'

    #         try require(moduleName).registerArgs program

    #     else

    #         try moduleName.registerArgs program

    # program.start()

    run: (fn) -> run = fn


module.exports.promise = -> return master.promise


Object.defineProperty global, 'objective',

    get: -> Objective

    configurable: false

Object.defineProperty objective, 'runningChild',

    get: -> run.promise || false

    configurable: false

program = require './cli'

objective.logger = require './logger'

program.start()

