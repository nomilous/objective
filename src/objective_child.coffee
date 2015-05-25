{debug, TODO, info, error} = require './logger'

{promise, defer} = require 'when'

sequence = require 'when/sequence'

{sep} = require 'path'

init = require './objective_init'

deferrals = []

module.exports.nextPromise = ->

    # Sometimes it's necessary to run objectives from a list, one at a time

    return false unless deferrals.length > 0

    return deferrals.shift().promise


module.exports.load = (config, callback) ->

    objective.node ||= {}

    objective.node.children ||= {}

    objectiveFn = ->

    deferrals.push deferral = defer()

    init.globals()
    
    .then -> init.user config
    
    .then -> init.plugins config
    
    .then -> module.exports.run config, objectiveFn, deferral

    .catch (e) -> deferral.reject e

    
    if callback?

        caller = objective.getCallerFileName 3

        caller = caller.replace process.cwd() + sep, ''

        config.filename = caller

        objectiveFn = callback

        objective.currentChild = config

        return


    return run: (fn) ->

        caller = objective.getCallerFileName 2

        caller = caller.replace process.cwd() + sep, ''

        config.filename = caller

        objectiveFn = fn

        objective.currentChild = config



module.exports.run = (config, objectiveFn, deferral) ->

    # Prepare list of already loaded modules

    required = {}

    required[filename] = {} for filename of require.cache

    clearRequire = ->

        for filename of require.cache

            continue if required[filename]?

            delete  require.cache[filename]

            debug "Removed #{filename} from require cache"


    unless config.uuid? and config.uuid.length > 10

        config.uuid = config.filename

    

    #
    # All modules not in this list will be flushed at the
    # end of the objective.
    # 
    #     ie. Any modules that the objective itself lods
    #         will be removed
    # 

    TODO 'beforeAll, afterALL/Each for plugins'

    sequence( for name of objective.plugins

        do (name) -> -> promise (resolve, reject) ->

            debug "Running beforeEach in plugin '#{name}'"

            plugin = objective.plugins[name]

            if plugin.$$beforeEach and typeof plugin.$$beforeEach == 'function'

                return plugin.$$beforeEach config, (err) ->

                    return reject err if err?

                    resolve()

            resolve()

    ).then ->

        if objectiveFn.toString() == 'function () {}'

            return process.nextTick ->

                clearRequire()

                deferral.resolve()

        try

            running = objective.injector {}, objectiveFn

            if running? and running.then? and typeof running.then == 'function'

                running.then(

                    (result) -> 

                        objective.currentChild = {}
                        clearRequire()
                        deferral.resolve result

                    (error) ->

                        objective.currentChild = {}
                        clearRequire()
                        deferral.reject

                    deferral.notify

                )

                if running.start? and typeof running.start == 'function'

                    running.start()

                return

            process.nextTick ->

                clearRequire()

                objective.currentChild = {}

                deferral.resolve()

        catch e

            clearRequire()

            objective.currentChild = {}

            return deferral.reject e


    .catch (e) ->

        TODO 'objective gets e, or err, error if in args'

        error 'error in plugin beforeEach'
        error e.stack

        deferral.reject e



    # setTimeout deferral.resolve, 1000

    # return






    # if objective.root.children[config.uuid]?

    #     oldConfig = objective.root.children[config.uuid].root

    #     objective.prompt.startbg()

    #     debug "Updating '#{config.title}' from '#{oldConfig.filename}'"

    #     config.filename = oldConfig.filename

    #     objective.root.children[config.uuid] = root: config

    #     objective.root.children[config.uuid].doRun = true

    # else

    #     config.filename = objective.loading

    #     info "Loading '#{config.title}' from '#{config.filename}'"

    #     objective.root.children[config.uuid] = root: config


    # # run, for child objectives

    # return run: (fn) ->

    #     run = When.defer()

    #     objective.root.children[config.uuid].run = fn

    #     return run.resolve() unless program.run or objective.root.children[config.uuid].doRun

    #     TODO 'flag to disable require cache flushing'

    #     for moduleFile of require.cache

    #         continue if required[moduleFile]

    #         delete require.cache[moduleFile]

    #     info "Running '#{config.title}' from '#{config.filename}'"
        
    #     try

    #         for name of objective.plugins

    #             try objective.plugins[name].before config

    #         childRunning = fn()

    #         if childRunning? and typeof childRunning.then is 'function'

    #             childRunning.then(

    #                 (result) ->

    #                     debug objective_result: result

    #                     pipe.emit 'objective.result', error: null, result: result, ->
                            
    #                         objective.prompt.endbg()
    #                         run.resolve()

    #                 (err) ->

    #                     console.log err.stack

    #                     error objective_error: err

    #                     pipe.emit 'objective.result', error: err, result: null, ->
                            
    #                         objective.prompt.endbg()
    #                         run.resolve()

    #                 (message) ->

    #                     debug objective_notify: notify

    #                     pipe.emit 'objective.notify', message: message,  ->

    #                         run.resolve()
                        
    #             )

    #             childRunning.start() if typeof childRunning.start is 'function'

    #         else

    #             objective.prompt.endbg()
    #             run.resolve()
    #             # done()

    #     catch e

    #         error e.stack + '\n'
    #         run.resolve()
    #         # done()
