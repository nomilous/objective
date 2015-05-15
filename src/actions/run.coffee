fs = require 'fs'

uplink = require '../uplink'

pipe = require '../pipeline'

pipe.createEvent 'objective.init'

recurse = require '../modules/recurse'

prompt = require '../prompt'

{sep} = require 'path'

{deferred, pipeline} = require 'also'

lang = undefined

module.exports = run = 

    do: (program, callback) ->

        file = program.file || 'objective'

        unless file.match(/.coffee$/) or file.match(/.js$/)

            ['.js', '.coffee'].forEach (ext) ->
     
                try

                    stats = fs.lstatSync file + ext
                    file = file + ext unless stats.isDirectory()

        try

            # console.log 'loading objective from ' + file
            
            js = fs.readFileSync(file).toString()
            if file.match /.coffee$/
                coffee = require 'coffee-script'

                # objective is coffee, assume all should be
                lang = 'coffee'

                # TODO: compile errors
                js = coffee.compile js, bare: true
            else
                lang = 'js'
                js = '(' + js + ')'

            lang = 'js' if program.js

            # TODO: eval errors

            objective = eval js



            run = ->

                if program.offline

                    return objective.root (err) ->

                        console.log err.toString() if err?
                        callback()


                uplink.connect objective, (err) ->

                    if err?

                        console.log err.toString()
                        process.exit 1

                    objective.root (err) ->

                        console.log err.toString() if err?

                        uplink.disconnect()
                        callback()


            plugins = {}

            if objective.modules?

                for moduleName in objective.modules

                    name = moduleName.split(sep).pop().replace /^objective-/, ''

                    if name.match /[-\._]/

                        parts = name.split /[-\._]/

                        camel = parts[0]

                        for i in [1..parts.length - 1]

                            p = parts[i][0].toUpperCase()

                            camel += p + parts[i][1..]

                        name = camel

                    try

                        plugins[name] = require moduleName;
                        
                        eval "var #{name} = plugins[name];"

                        console.log "Loaded module '#{moduleName}' as '#{name}'"

                    catch e

                        console.log e.toString()


                pipeline( for name of plugins

                    do (name) -> deferred ({resolve, reject}) ->

                        plugin = plugins[name]

                        # unless typeof plugin.init == 'function'

                        #     return reject new Error "plugin missing init(tools, callback);"

                        plugin.init

                            pipe: pipe

                            (err) ->

                                return reject err if err? 

                                resolve()

                        
                ).then(

                    (result) -> 

                        pipe.emit 'objective.init',

                            uplink: uplink
                            program: program
                            objective: objective
                            language: lang
                            # prompt: prompt

                            (err) ->

                                return run() unless err?
                                console.log err.toString()
                                callback err
                                

                    (error) -> 

                        console.log err.toString()
                        callback err

                )

                return # with modules
            

            run() # without modules

        catch e
            
            console.log e
            callback()

