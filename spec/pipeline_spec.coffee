{ipso} = require 'ipso'

describe 'Pipeline', ->



    it 'defines emit() accepting event payload and callback and callsback', 

        ipso (done, Pipeline, should) ->

            Pipeline.emit 'event', {}, ->

                done()



    it 'defines on() accepting event and hander fn and stores handler',

        ipso (done, Pipeline, should) ->

            Pipeline.on 'new event', (payload, next) -> 

                ### EVENT HANDLER ###

            Pipeline.pipes['new event'][0].toString().should.match /EVENT HANDLER/

            done()



    it 'callsback with error on no handler for event',

        ipso (done, Pipeline, should) ->

            Pipeline.emit 'event', 'payload', (err, res) ->

                err.should.match /Error/
                done()



    it 'runs the handler on the event',

        ipso (done, Pipeline, should) ->

            Pipeline.pipes = []

            Pipeline.on 'event', (payload, next) ->

                payload.test = 1
                next()

            Pipeline.emit 'event', {}, (err, res) ->

                res.test.should.equal 1
                done()


    it 'exits to error on first middleware fail',

        ipso (done, Pipeline, should) ->

            Pipeline.pipes = []

            Pipeline.on 'event', (payload, next) ->

                throw new Error 'E'
                next()

            run = false

            Pipeline.on 'event', (payload, next) ->

                console.log 'SHOULD NOT RUN'
                run = true
                next()

            Pipeline.emit 'event', {}, (err, res) ->

                err.should.match /E/
                run.should.equal false
                done()




