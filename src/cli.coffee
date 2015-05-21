# {objective} = global

{lstatSync, readFileSync} = require 'fs'

module.exports = program = require 'commander'

{info, error, debug} = require './logger'

program.stop = false

program
    
.version(JSON.parse(require('fs').readFileSync(__dirname + '/../package.json')).version)

.option('--create', 'Create new objective.')

.option('--file [file]', 'Run objective from file. (name part)')

.option('--register', 'Register new user.')

.option('--reset', 'Re-register as existing user by email (forgot password).')

.option('--create-dev', 'Create new dev objective.')

.option('--template [name]', 'Create new objective from template')

.option('--private', 'To create objective as private.')

.option('--force', 'Force action.')

.option('--js', 'Use javascript for --create.')

.option('--recurse [dir]', 'Recurse directory for child objectives.')

# .option('--run', 'Run child objectives. (from --recurse)')

.option('--prompt', 'Proceed to prompt, skipping run')

.option('--offline', 'Run offline.')

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

        if program.file?

            info "Loading '#{program.file}'"

            try

                program.file = process.cwd() + '/' + program.file unless program.file[0] == '/'

                require program.file

                return

            catch e

                return error e.stack

        for file in ['./objective.coffee', './objective.js']

            try
                
                lstatSync file

                info "Loading '#{file}'"

                try

                    require process.cwd() + '/' + file

                    return 

                catch e

                    return error e.stack


        error '\nNothing to do.'
        process.exit 1


