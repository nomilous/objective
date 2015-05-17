Object.defineProperty global, 'objective',

    writable: false
    
    value: {}
    
program = require './cli'

return if program.stop

{deferred, pipeline} = require 'also'

path = require 'path'

fs = require 'fs'

required = {}

module.exports = (config = {}) ->

    if objective.root?

        # loading child objective (from objective.recurse)

        objective.root.children ||= {}

        if objective.root.children[config.uuid]?

            oldConfig = objective.root.children[config.uuid].root

            console.log "Updating objective from '#{oldConfig.filename}'"

            config.filename = oldConfig.filename

            # reloading changed child objective

            # # # console.log changed: config.uuid

            objective.root.children[config.uuid] = root: config

            objective.root.children[config.uuid].doRun = true

        else

            config.filename = objective.loading

            console.log "Loading objective from '#{config.filename}'"

            objective.root.children[config.uuid] = root: config

        return run: (fn) ->

            # run, for child objectives

            objective.root.children[config.uuid].run = fn

            if program.run or objective.root.children[config.uuid].doRun

                for moduleFile of require.cache

                    continue if required[moduleFile]

                    delete require.cache[moduleFile]

                console.log "Running objective from '#{config.filename}'"
                
                try

                    fn()

                catch e

                    console.log e.stack + '\n'


    objective.root = config

    run = (e) ->

        console.log 'Missing .run(fn)'
        console.log e.toString() if e?

    loadGlobal = (name, path) ->

        if objective[name]?

            console.log "Warning: global #{name} no loaded."
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

    pipeline(

        for moduleName in config.plugins

            do (moduleName) -> deferred ({resolve, reject}) ->

                name = moduleName.split(path.sep).pop().replace /^objective-/, ''

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

                    global[name] = require moduleName

                catch e

                    return reject e

                console.log "Loading plugin '#{moduleName}' as '#{name}'"

                try

                    global[name].init (e) -> 

                        return reject e if e?

                catch e

                    return reject e

                resolve()

    ).then(

        (result) -> process.nextTick ->

            # remember all cached modules before running to allow flushing
            # all but the starting modules at next run

            required[filename] = {} for filename of require.cache

            if program.recurse? 

                unless typeof program.recurse is 'string'

                    console.log "\nRecurse needs [dir]"
                    return

                dir = program.recurse

                return objective.recurse dir, (err) ->

                    return run err if err?

                    run null

            run null

        (error) -> process.nextTick -> run error

    )

    run: (fn) -> run = fn
