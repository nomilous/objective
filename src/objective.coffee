fs = require 'fs'

program = require 'commander'

program
    
    .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version)

    .option('-R, --register', 'Register new user.')

    .parse(process.argv)


if program.register then return require('./actions/register').do()
