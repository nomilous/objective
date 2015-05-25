# {objective} = global

{lstatSync, readFileSync} = require 'fs'

module.exports = program = require 'commander'

{info, error, debug, TODO} = require './logger'

{sep} = require 'path'

{promise} = require 'when'

sequence = require 'when/sequence'

program.stop = false  # ?? 

pipe = require './globals/pipeline'

pipe.createEvent 'multiple.start'
pipe.createEvent 'multiple.done'

program
    
.version(JSON.parse(require('fs').readFileSync(__dirname + '/../package.json')).version)

# .option('--create', 'Create new objective.')

.option('--root [file]', 'Run root objective from file. (name part)')

# .option('--register', 'Register new user.')

# .option('--reset', 'Re-register as existing user by email (forgot password).')

# .option('--create-dev', 'Create new dev objective.')

# .option('--template [name]', 'Create new objective from template')

# .option('--private', 'To create objective as private.')

# .option('--force', 'Force action.')

# .option('--js', 'Use javascript for --create.')

# .option('--recurse [dir]', 'Recurse directory for child objectives.')

# .option('--run', 'Run child objectives. (from --recurse)')

# .option('--prompt', 'Proceed to prompt, skipping run')

# .option('--offline', 'Run offline.')

module.exports.start = ->

    program.parse(process.argv)

    if program.register

        program.stop = true

        return require('./actions/register').do program, false, ->

    if program.reset 

        program.stop = true

        return require('./actions/register').do program, true, ->

    program.template ||= 'default'

    if program.create

        program.stop = true

        return require('./actions/create').do program, program.template, ->

    if program.createDev

        program.stop = true

        return require('./actions/create').do program, 'dev', ->



    unless objective.root?

        require('coffee-script').register()

        program.file = program.root

        if program.file?

            info "Loading '#{program.file}'"

            try

                program.file = process.cwd() + sep + program.file unless program.file[0] == '/'

                require program.file

                return

            catch e

                return error e.stack



        if program.args.length > 0

            # 
            # running without root from list of objective files in args
            #

            objective.noRoot = true

            return sequence( for file in program.args

                do (file) -> -> promise (resolve, reject) ->

                    try

                        modFile = process.cwd() + sep + file

                        require modFile

                        return resolve() unless done = objective.waiting

                        done.then(

                            (r) ->

                                # console.log r: r

                                resolve r

                            (e) ->

                                # console.log e: e

                                resolve()
                                TODO 'enable fail on error'
                                error e
                                debug e.stack

                        )

                    catch e

                        console.log e

                        resolve()

            ).then(

                (result) ->

                    pipe.emit 'multiple.done',

                        result: result
                        error: null

                        (err, after) ->

                            exitCode = after.exitCode || 0

                            process.exit exitCode

                (error) ->

                    # console.log error

                    process.exit 1

            )


        for file in ['./objective.coffee', './objective.js']

            try
                
                lstatSync file

                info "Loading '#{file}'"

                try

                    require process.cwd() + sep + file

                    return 

                catch e

                    return error e.stack

        unless program.args.length > 0

            error '\nNothing to do.'
            process.exit 1





