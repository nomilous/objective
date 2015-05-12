fs = require 'fs'

uplink = require '../uplink'

module.exports = run = 

    do: (program, callback) ->

        file = program.file || 'objective'

        unless file.match(/.coffee$/) or file.match(/.js$/)

            ['.js', '.coffee'].forEach (ext) ->
     
                try

                    stats = fs.lstatSync file + ext
                    file = file + ext unless stats.isDirectory()

        try
            
            js = fs.readFileSync(file).toString()
            
            if file.match /.coffee$/
                coffee = require 'coffee-script'
                js = coffee.compile js, bare: true
            else
                js = '(' + js + ')'

            objective = eval js

            uplink.connect objective, (err) ->

                if err?

                    console.log err.toString()
                    process.exit 1

                objective.root ->

        catch e
            
            console.log e
            callback()
