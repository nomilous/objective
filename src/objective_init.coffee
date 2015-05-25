{debug, info, error, TODO} = require './logger'

{promise} = require 'when'

sequence = require 'when/sequence'

{sep, normalize} = require 'path'


module.exports.user = (config) -> promise (resolve, reject) ->

    config.plugins ||= []

    defaultPlugins = (defaults = []) ->

        debug 'Loading plugin defaults from user'

        for plugin in defaults

            if typeof plugin == 'string'

                continue unless config.plugins.indexOf(plugin) == -1

            config.plugins.push plugin

    if objective.user?

        debug 'User already loaded'

        defaultPlugins objective.user.plugins

        return resolve()

    configDir = process.env[ if process.platform == 'win32' then 'USERPROFILE' else 'HOME'] + sep + '.objective'

    userFile = configDir + sep + 'user'

    try

        debug "Loading user from file '#{userFile}'"

        user = require userFile

        if user.init? and typeof user.init == 'function'

            debug 'User has init(), running.'

            return user.init (err) ->

                if err?

                    debug 'User init error ' + err

                    return reject err

                objective.user = user

                defaultPlugins user.plugins

                debug 'User loaded.'

                resolve()

        objective.user = user

        defaultPlugins user.plugins

        debug 'User loaded without init()'

        resolve()
        
    catch

        objective.user = 'none'

        resolve()



module.exports.globals = -> promise (resolve, reject) ->

    if objective.globals?

        debug 'Globals already loaded.'

        return resolve()

    loadGlobal = (name, path) ->

        if objective[name]?

            info "Warning: global #{name} not loaded."
            return

        debug "Loading global 'objective.#{name}'"
        objective[name] = require path
        objective.coffee.register() if name == 'coffee'
        objective.globals ||= []
        objective.globals.push name

    loadGlobal 'recurse', './globals/recurse'
    loadGlobal 'coffee', 'coffee-script'
    loadGlobal 'uplink', './globals/uplink'
    loadGlobal 'prompt', './globals/prompt'
    loadGlobal 'pipe', './globals/pipeline'
    loadGlobal 'injector', './globals/injector'
    loadGlobal 'queue', './globals/queue'

    TODO 'repeat() global'

    resolve()



module.exports.plugins = (config) -> promise (resolve, reject) ->

    TODO 'user defaults per plugin $$name'

    unless config.plugins.length > 0

        debug 'No plugins to load'

        return resolve()

    sequence( for plugin in config.plugins

        do (plugin) -> -> promise (resolve, reject) ->

            if typeof plugin == 'string'

                if plugin.match /\.\//

                    plugin = normalize process.cwd() + sep + plugin

                try

                    debug "Loading plugin from '#{plugin}'"

                    mod = require plugin

                    if objective.user? and defaults = objective.user.defaults[plugin]

                        debug "Loading user defaults for plugin #{plugin}"

                        mod[key] = defaults[key] for key of defaults

                catch e

                    return reject e

            unless mod.$$name?

                return reject new Error 'Objective plugins must respond to $$name property.'

            name = mod.$$name

            objective.plugins ||= {}

            if objective.plugins[name]?

                debug "Plugin '#{name}' already loaded."

                return resolve()

            if mod.init? and typeof mod.init == 'function'

                return mod.init (err) ->

                    if err?

                        debug "Plugin '#{name}' init failed #{err.toString()}"

                        return reject err

                    debug "Plugin '#{name}' loaded."

                    objective.plugins[name] = mod

                    resolve()


            debug "Plugin '#{name}' loaded."

            objective.plugins[name] = mod

            resolve()

    ).then( resolve ).catch reject



