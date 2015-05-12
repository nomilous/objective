fs = require 'fs'

program = require 'commander'

program
    
    .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version)

    .option('-R, --register', 'Register new user.')

    .option('-C, --create', 'Create new objective.')

    .option('-f, --file [file]', 'Specify objective file namepart.' )

    .option('-F, --force', 'Force action.')

    .option('-j, --js', 'Use javascript for --create.')

    .parse(process.argv)

console.log 'TODO: --refresh-user (json)'

if program.register then return require('./actions/register').do program, ->

if program.create then return require('./actions/create').do program, ->

require('./actions/run').do program, ->

