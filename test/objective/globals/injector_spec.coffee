describe.only 'Objective Injector', ->

    require '../../../'

    should = require 'should'

    before ->
        @origError = objective.logger.error

    beforeEach ->
        objective.logger.error = @origError

    after ->
        objective.logger.error = @origError


    it 'is shared', -> should.exist objective.injector

    context 'standard args', ->

        it 'injects error', (done) ->

            e = new Error 'Monday'

            objective.injector null, error: e, (e) ->
                e.toString().should.match /Error: Monday/

            .then -> objective.injector null, error: e, (er) ->
                er.toString().should.match /Error: Monday/         

            .then -> objective.injector null, error: e, (err) ->
                err.toString().should.match /Error: Monday/

            .then -> objective.injector null, error: e, (error) ->
                error.toString().should.match /Error: Monday/

            .then done

            .catch done


        it 'logs un accepted errors', (done) ->

            e = new Error 'Winter'

            objective.logger.error = (m, err) ->

                m.should.equal 'unaccepted error injected'
                err.should.equal e.stack
                done()

            objective.injector null, args:[1], error: e, (noErrorInArgs) ->


        it 'injects next or done', (_done) ->

            objective.injector null,

                next: -> _done()

                (done, next) ->

                    done.should.equal next
                    next()


        it 'injects plugins, recursor, linker, and globals', (done) ->

            objective.injector root,

                plugins: 1
                recurse: 2
                link: 3

                (plugins, recurse, link, pipeline, injector, prompt) ->

                    plugins.should.eql 1
                    recurse.should.eql 2
                    link.should.eql 3
                    pipeline.should.eql objective.pipeline
                    injector.should.eql objective.injector
                    prompt.should.eql objective.prompt
                    done()


        it 'injects cancel as cancel or stop', (done) ->

            # ie. anti-next (without failing/hanging pipeline event)

            objective.injector null,

                cancel: -> done()

                (cancel, stop) -> 

                    stop.should.equal cancel
                    stop()


    it 'injects a sequence of args among the standard args', (done) ->

        objective.injector null,

            args: [1,2,3,4]
            next: done

            (one, two, next, three, four) ->

                one.should.equal 1
                two.should.equal 2
                three.should.equal 3
                four.should.equal 4
                next()



    context 'plugin access to injector', ->


        it 'queries pipeline for arg', (done) ->

            root = 'ROOT'
            objective.pipeline.on 'objective.injecting', handler = (details) ->

                details.root.should.equal root
                details.thisName.should.equal 'unknownArg'
                (typeof details.thisValue == 'undefined').should.equal true
                details.thisValue = 'CREATED ARG'
                console.log('CREATE SKIP')
                # skip()

            objective.injector root,

                args: [1,2]
                next: done

                (next, one, two, unknownArg) ->

                    objective.pipeline.off 'objective.injecting', handler
                    unknownArg.should.equal 'CREATED ARG'
                    next()

    context 'node_module injection', ->

        it 'falls back to node modules', (done) ->

            objective.injector null,

                args: [1,2]
                next: done

                (next, one, two, zlib) ->

                    zlib.should.equal require 'zlib'
                    next()


        it 'calls onError', (done) ->

            objective.injector root,

                onError: (e) ->

                    e.toString().should.match /Cannot find module \'missing\'/
                    done()

                (missing) ->



    context 'proxied promise', ->

        promise = require('when').promise

        it 'proxies the promise returned by the injection target', (done) ->

            promised = objective.injector null, ->

                return promise (resolve, reject) ->

                    resolve 'Result!'

            promised.then (result) ->

                result.should.equal 'Result!'
                done()


        it 'passes the call to start', (done) ->

            promised = objective.injector null, ->

                result = null
                p = promise (resolve, reject) -> 
                    process.nextTick -> resolve result

                p.start = (err, arg) -> result = arg 

                return p

            promised.then (result) ->
                result.should.equal 'ARG'
                done()

            promised.start('ARG')


    context 'ignoreError', ->

        promise = require('when').promise

        it 'does not run injection target on error', (done) ->

            objective.injector null,

                onError: -> done()

                (noSuchModule) ->

                    throw new Error 'Not!'


        it 'sets to run even with injection error', (done) ->

            objective.injector null,

                ignoreError: true

                (noSuchModule) ->

                    should.not.exist noSuchModule
                    done()


        it 'can get error into injection target via promise start extension', (done) ->

            promised = objective.injector null, ignoreError: true, (noSuchModule) ->

                p = promise (resolve) -> resolve()
                p.start = (e) -> 
                    e.toString().should.match /Cannot find module \'noSuchModule\'/
                    done()
                return p

            promised.start()













