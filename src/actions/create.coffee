user = require '../user'
request = require 'request'
fs = require 'fs'
uuid = require 'uuid'
{deferred} = require 'also'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"  # pending cert

module.exports = create = 

    do: (program, template, callback) ->

        user.load() unless program.offline

        create.generate_objective(program, template).then ->

            callback()

    generate_objective: deferred (action, program, template) ->

        unless program.private?

            program.private = false

        file = program.file || 'objective'
        if program.js then file = "#{file}.js" unless file.match /.js$/
        else file = "#{file}.coffee" unless file.match /.coffee$/


        try
            stats = fs.lstatSync file
            if stats.isDirectory()
                console.log "\nCannot overwrite directory '#{file}'"
                return action.resolve()

            unless program.force
                console.log "\nError '#{file}' exists. Use --force to overwrite."
                return action.resolve()

        if program.js
            templatePath = process.env.HOME + '/.objective/templates/' + template + '.js'
        else
            templatePath = process.env.HOME + '/.objective/templates/' + template + '.coffee'

        createFromTemplate = (template, Uuid) ->

            Uuid ||= uuid.v4()

            try

                templatetxt = undefined
                try
                    templatetxt = fs.readFileSync(templatePath).toString()
                catch
                    console.log "\nError: Missing templates. Try --register"
                    action.resolve()
                    return
                
                templatetxt = templatetxt.replace /__UUID__/, Uuid
                templatetxt = templatetxt.replace /__PRIVATE__/, program.private

                try

                    fs.writeFileSync file, templatetxt
                    console.log '\n-----> Created file ' + file + ' (from template ~' + templatePath + ')'
                    action.resolve()

                catch e
                    
                    console.log e.toString()
                    action.resolve()
                
            catch e

                console.log e.toString()
                action.resolve()


        if program.offline

            try
                
                stat = fs.lstatSync templatePath
                return createFromTemplate template
            
            catch e
                
                console.log "\nWarning: Missing template '#{templatePath}'"

            if program.js

                content = """
                objective( 'Untitled', {

                    uuid: '#{uuid.v4()}',
                    description: '',
                    private: #{program.private},
                    plugins: []

                }).run(function(){


                });

                """

            else

                content = """
                objective 'Untitled',

                    uuid: '#{uuid.v4()}'
                    description: ''
                    private: #{program.private}
                    plugins: []

                .run ->


                """

            try
                fs.writeFileSync file, content
                console.log "\n-----> Created file " + file
                action.resolve()
                return
            
            catch e

                console.log e.toString()
                action.resolve()
                return


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

                {Uuid} = JSON.parse body

                createFromTemplate template, Uuid

