user = require '../user'
request = require 'request'
fs = require 'fs'
{deferred} = require 'also'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"  # pending cert

module.exports = create = 

    do: (program, template, callback) ->

        user.load()

        create.generate_objective(program, template).then ->

            callback()

    generate_objective: deferred (action, program, template) ->

        file = program.file || 'objective'
        if program.js then file = "#{file}.js" unless file.match /.js$/
        else file = "#{file}.coffee" unless file.match /.coffee$/


        try
            stats = fs.lstatSync file
            if stats.isDirectory()
                console.log "Cannot overwrite directory #{file}"
                return action.resolve()

            unless program.force
                console.log "Warning #{file} exists. Use --force to overwrite."
                return action.resolve()

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
                        templatePath = '/.objective/templates/' + template + '.js'
                    else
                        templatePath = '/.objective/templates/' + template + '.coffee'
                    templatetxt = undefined
                    try
                        templatetxt = fs.readFileSync(process.env.HOME + templatePath).toString()
                    catch
                        console.log 'Error: Missing templates. Try --register'
                        action.resolve()
                        return
                    templatetxt = templatetxt.replace /__UUID__/, uuid
                    templatetxt = templatetxt.replace /__PRIVATE__/, program.private
                    console.log '-----> Created file ' + file + ' (from template ~' + templatePath + ')'
                    console.log templatetxt
                    fs.writeFileSync file, templatetxt
                    

                catch e
                    console.log e.toString()
                    action.resolve()
