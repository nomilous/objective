user = require '../user'
request = require 'request'
fs = require 'fs'
{deferred} = require 'also'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"  # pending cert

module.exports = create = 

    do: (program, callback) ->

        user.load()

        create.generate_objective(program).then ->

            callback()

    generate_objective: deferred (action, program) ->

        file = program.file || 'objective'
        if program.js then file = "#{file}.js" unless file.match /.js$/
        else file = "#{file}.coffee" unless file.match /.coffee$/


        try
            stats = fs.lstatSync file
            if stats.isDirectory()
                console.log "Cannot overwrite directory #{file}"
                return callback()

            unless program.force
                console.log "Warning #{file} exists. Use --force to overwrite."
                return callback()

        request.post

            url: 'https://ipso.io/api/objectives/create'
            method: 'POST'
            headers: 
                'content-type': 'application/json'
                'key': user.key
            
            (error, response, body) ->

                if error?
                    console.log 'An error has occurred.'
                    process.exit 1

                if response.statusCode == 401
                    console.log 'Bad key, try --refresh-user'
                    process.exit 1

                if response.statusCode >= 500
                    console.log 'An error has occurred.'
                    process.exit 1

                {uuid} = JSON.parse body

                try
                    if program.js
                        fs.writeFileSync file, "{\n    uuid: '#{uuid}',\n    title: '',\n    description: '',\n    root: function(done){\n\n    }\n}"
                    else
                        fs.writeFileSync file, "uuid: '#{uuid}'\ntitle: ''\ndesciption: ''\nroot: (done) ->\n    "

                catch e
                    console.log e.toString()
                    callback()
