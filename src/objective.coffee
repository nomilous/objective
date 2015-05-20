{deferred, pipeline, util} = require 'also'

process.env.DEBUG = 'info,error,TODO' unless process.env.DEBUG?

{info, debug, error, TODO} = require './logger'

pipe = require './globals/pipeline'

pipe.createEvent 'objective.result'
pipe.createEvent 'objective.notify'

path = require 'path'

fs = require 'fs'

uuid = require 'uuid'

required = {}

module.exports = Objective = (config = {}) ->

    if typeof config == 'string'

        title = config

        config = arguments[1] || {}

        config.title = title

    if objective.root?

        # loading child objective (from objective.recurse)

        objective.root.children ||= {}

        if objective.root.children[config.uuid]?

            oldConfig = objective.root.children[config.uuid].root

            objective.prompt.startbg()

            info "Updating '#{config.title}' from '#{oldConfig.filename}'"

            config.filename = oldConfig.filename

            # reloading changed child objective

            # # # console.log changed: config.uuid

            objective.root.children[config.uuid] = root: config

            objective.root.children[config.uuid].doRun = true

        else

            config.filename = objective.loading

            info "Loading '#{config.title}' from '#{config.filename}'"

            objective.root.children[config.uuid] = root: config

        return run: (fn) ->

            # run, for child objectives

            objective.root.children[config.uuid].run = fn

            if program.run or objective.root.children[config.uuid].doRun

                for moduleFile of require.cache

                    continue if required[moduleFile]

                    delete require.cache[moduleFile]

                info "Running '#{config.title}' from '#{config.filename}'"
                
                try

                    for name of objective.plugins

                        try objective.plugins[name].before config

                    running = fn()

                    if running? and typeof running.then is 'function'

                        running.then(

                            (result) ->

                                debug result: result

                                pipe.emit 'objective.result', error: null, result: result, ->
                                    
                                    objective.prompt.endbg()

                            (error) -> 

                                error error: error

                                pipe.emit 'objective.result', error: error, result: null, ->
                                    
                                    objective.prompt.endbg()

                            (message) ->

                                debug notify: notify

                                pipe.emit 'objective.notify', message: message,  ->
                                

                        )

                        running.start() if typeof running.start is 'function'

                    else

                        objective.prompt.endbg()

                catch e

                    error e.stack + '\n'


    objective.root = config

    run = (e) ->

        console.log 'Missing .run(fn)'
        console.log e.toString() if e?

    loadGlobal = (name, path) ->

        if objective[name]?

            info "Warning: global #{name} not loaded."
            return

        # console.log "Loading global '#{name}'"
        objective[name] = require path
        objective.coffee.register() if name == 'coffee'


    loadGlobal 'recurse', './globals/recurse'
    loadGlobal 'coffee', 'coffee-script'
    loadGlobal 'uplink', './globals/uplink'
    loadGlobal 'prompt', './globals/prompt'
    loadGlobal 'pipe', './globals/pipeline'


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

                                return reject e if e?

                                resolve()

                        catch e

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

                            return reject e if e?

                            objective.plugins[name] = global[name]

                            resolve()

                    catch e

                        return reject e


    ).then(

        (result) ->

            TODO 'promises after run to emit'

            process.nextTick ->

                # remember all cached modules before running to allow flushing
                # all but the starting modules at next run

                required[filename] = {} for filename of require.cache

                if program.recurse?

                    unless typeof program.recurse is 'string'

                        info "\nRecurse needs [dir]"
                        return

                    dir = program.recurse

                    return objective.recurse dir, (err) ->

                        return run err if err?

                        run null

                return objective.prompt() if program.prompt

                run null

        (err) ->

            TODO 'promises after run to emit'

            return error err.stack if program.prompt

            process.nextTick ->

                # initialization error has ocurred, pass into the objective runner or display here
                # per whether or not the runner has e in arg signature 

                # pending injector

                runArgs = util.argsOf run

                i = 0

                position = -1

                for arg in runArgs

                    if arg == 'e' or arg == 'er' or arg == 'err' or arg == 'error'

                        position = i

                    i++

                if position >= 0

                    argsToRun = []

                    for i in [0..runArgs.length - 1]

                        if i == position

                            argsToRun.push err

                        else
                            argsToRun.push i

                    return run.apply {}, argsToRun

                error err.stack

                run.apply {}



    )

    # for moduleName in config.plugins

    #     if typeof moduleName == 'string'

    #         try require(moduleName).registerArgs program

    #     else

    #         try moduleName.registerArgs program

    # program.start()

    run: (fn) -> run = fn


Object.defineProperty global, 'objective',

    get: -> Objective

    configurable: false

program = require './cli'

objective.logger = require './logger'

program.start()

