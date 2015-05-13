fs = require 'fs'

uplink = require '../uplink'

pipeline = require '../pipeline'

recurse = require '../modules/recurse'

prompt = require '../prompt'

module.exports = run = 

    do: (program, callback) ->

        file = program.file || 'objective'

        unless file.match(/.coffee$/) or file.match(/.js$/)

            ['.js', '.coffee'].forEach (ext) ->
     
                try

                    stats = fs.lstatSync file + ext
                    file = file + ext unless stats.isDirectory()

        try

            console.log 'loading objective from ' + file
            
            js = fs.readFileSync(file).toString()
            if file.match /.coffee$/
                coffee = require 'coffee-script'

                # TODO: compile errors
                js = coffee.compile js, bare: true
            else
                js = '(' + js + ')'


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


            

            if objective.module?

                mod = require objective.module
                name = objective.module.replace /^objective-/, ''
                console.log "loading module #{objective.module} as #{name}"
                eval "var #{name} = mod;"

                # asyncronous module init

                return mod.init

                    pipe: pipeline
                    prompt: prompt

                    (err) ->

                        if err?
                            
                            console.log "error initializing module #{name}, #{err.toString()}"
                            return callback()

                        run() # with module

            

            run() # without module

        catch e
            
            console.log e
            callback()

