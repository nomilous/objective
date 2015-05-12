{deferred} = require 'also'
prompt = require 'prompt'
request = require 'request'
fs = require 'fs'
mkpath = require 'mkpath'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"  # pending cert

email = code = username = password = key = undefined

module.exports = register =

    do: (program, callback) ->

        unless process.env.HOME?
            console.log 'missing HOME env variable'
            process.exit 1

        register.prompt_email()
        .then -> register.prompt_code()
        .then -> register.prompt_username()
        .then -> register.prompt_password()
        .then -> callback()


    prompt_email: deferred (action) ->

        retry = ->

            console.log '\nPlease enter your email address.'

            prompt.get 'email', (err, res) ->

                if err? then process.exit 1

                email = res.email

                request.post 'https://ipso.io/api/register/email/' + email, 

                    (error, response, body) ->

                        if error? 
                            console.log error
                            process.exit 1

                        if response.statusCode == 403
                            console.log '\nThat email address is already in use.'
                            return retry()

                        if response.statusCode == 500
                            console.log '\nAn error has occurred.'
                            process.exit 1

                        if response.statusCode == 201
                            action.resolve()

        retry()



    prompt_code: deferred (action) ->

        retry = ->

            console.log '\nA registration code has been sent to that email address.\nPlease paste it here.'

            prompt.get 'code', (err, res) ->

                if err? then process.exit 1

                code = res.code

                request.post "https://ipso.io/api/register/email/#{email}/code/#{code}",

                    (error, response, body) ->

                        if error?
                            console.log error
                            process.exit 1

                        if response.statusCode == 403
                            console.log '\n Incorrect code!'
                            return retry()

                        if response.statusCode == 500
                            console.log '\nAn error has occurred.'
                            process.exit 1

                        if response.statusCode == 200
                            action.resolve()

        retry()



    prompt_username: deferred (action) ->

        retry = ->

            console.log '\nPlease enter new username.'

            prompt.get 'username', (err, res) ->

                if err? then process.exit 1

                username = res.username

                request.post "https://ipso.io/api/register/email/#{email}/code/#{code}/username/#{username}",

                    (error, response, body) ->

                        if error?
                            console.log error
                            process.exit 1

                        if response.statusCode == 403
                            console.log '\n That username is already in use.'
                            return retry()

                        if response.statusCode == 500
                            console.log '\nAn error has occurred.'
                            process.exit 1

                        if response.statusCode == 200
                            action.resolve()


        retry()



    prompt_password: deferred (action) ->

        retry = ->

            console.log '\nPlease enter new password.'

            prompt.get

                properties:
                    password:
                        hidden: true
                    'confirm password':
                        hidden: true

                (err, res) ->

                    if res.password != res['confirm password']
                        console.log '\nPasswords did not match!'
                        return retry()

                    password = res.password

                    request.post

                        url: "https://ipso.io/api/register"
                        method: 'POST'
                        headers: 'content-type': 'application/json'
                        body: JSON.stringify
                            email: email
                            code: code
                            username: username
                            password: password

                        (error, response, body) ->

                            if response.statusCode >= 500
                                console.log '\nAn error has occurred.'
                                process.exit 1

                            console.log body: body

                            {key, uuid} = JSON.parse body

                            dir = process.env.HOME + '/.objective'

                            mkpath.sync dir

                            fs.writeFileSync process.env.HOME + '/.objective/user.json', JSON.stringify

                                uuid: uuid
                                username: username
                                email: email
                                key: key
                                null
                                4

                            console.log '\n-----> Created file ' + process.env.HOME + '/.objective/user.json'

                            console.log '\nRegistration complete.'

                            action.resolve()


        retry()

        