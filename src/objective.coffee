fs = require 'fs'

program = require 'commander'

program
    
    .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version)

    .option('-R, --register', 'Register new user.')

    .option('-r, --reset', 'Re-register as existing user by email (forgot password).')

    .option('-C, --create', 'Create new objective.')

    .option('-S, --create-spec', 'Create new spec objective.')

    .option('-T, --template [name]', 'Create new objective from template')

    .option('-f, --file [file]', 'Specify objective file namepart.')

    .option('-F, --force', 'Force action.')

    .option('-j, --js', 'Use javascript for --create.')

    .option('-O, --offline', 'Run offline.')

    .parse(process.argv)


if program.register then return require('./actions/register').do program, false, ->

if program.reset then return require('./actions/register').do program, true, ->

program.template ||= 'default'

if program.create then return require('./actions/create').do program, program.template, ->

if program.createSpec then return require('./actions/create').do program, 'spec', ->

require('./actions/run').do program, ->

