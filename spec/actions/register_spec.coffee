{ipso} = require 'ipso'
{deferred} = require 'also'

describe 'Register', ->

    it 'prompts for email, code, username, password', ipso (done, Register) ->

        Register.does

            prompt_email: deferred (action) -> action.resolve()
            prompt_code: deferred (action) -> action.resolve()
            prompt_username: deferred (action) -> action.resolve()
            prompt_password: deferred (action) -> action.resolve()


        Register.do -> done()



    context 'email', ->

        it 'prompts for email address', 

            ipso (done, prompt, Register, should) ->

                prompt.does

                    get: (field)->

                        field.should.equal 'email'
                        done()

                Register.prompt_email()



        it 'submits new email to api and repeats prompt if not unique', 

            ipso (done, prompt, Register, should, request) ->

                count = 0

                prompt.does

                    get: (field, callback) ->

                        count++
                        console.log count
                        callback null, email: 'test@test.com'
                        

                request.does

                    post: (url, callback) ->

                        url.should.equal 'https://ipso.io/api/register/email/test@test.com'

                        if count == 2 then return callback null, statusCode: 201

                        callback null, statusCode: 403 # exists already


                Register.prompt_email().then -> 

                    count.should.equal 2
                    done()



    context 'code', ->

        it 'prompts for registration code', 

            ipso (done, prompt, Register, should) ->

                prompt.does

                    get: (field, callback) ->

                        field.should.equal 'code'
                        done()

                
                Register.prompt_code()

        it 'submits the email address and the code',

            ipso (done, prompt, Register, should, request) ->

                prompt.does

                    get: (field, callback) ->

                        callback null, code: 'REGISTRATION_CODE'

                request.does

                    post: (url, callback) ->

                        url.should.equal 'https://ipso.io/api/register/email/test@test.com/code/REGISTRATION_CODE'
                        done()

                Register.prompt_code()



    context 'username', ->

        it 'prompts for username', 

            ipso (done, prompt, Register, should) ->

                prompt.does

                    get: (field, callback) ->

                        field.should.equal 'username'
                        done()

                
                Register.prompt_username()

        it 'submits the email address and the code and the username',

            ipso (done, prompt, Register, should, request) ->

                prompt.does

                    get: (field, callback) ->

                        callback null, username: 'USER'

                request.does

                    post: (url, callback) ->

                        console.log url
                        done()

                Register.prompt_username()


    context 'password', ->

        it 'prompts for password',

            ipso (done, prompt, Register, should) ->

                prompt.does

                    get: (field) ->

                        field.should.eql
                            properties:
                                password:
                                    hidden: true
                                'confirm password':
                                    hidden: true
                        done()

                Register.prompt_password()

