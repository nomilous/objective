describe 'Objective', ->

    before -> require '../' # package.json

    context 'getCaller()', ->

        it 'gets the caller from the specified depth', ->

            objective.getCaller(0).fn.toString()
            .should.match /THIS_FUNCTION/

        it 'can remove cwd from the filename', ->

            objective.getCaller(0, true).file
            .should.equal 'test/objective_spec.coffee'


    context 'argsOf()', ->


        it 'returns the args of a function', ->

            (objective.argsOf ( fu,  nc,  t,  ion ) ->
             ).should.eql     ['fu','nc','t','ion']


    context 'rootWaiting', ->

        it 'is an objective deferral queue', ->
                                        #
                                        # misnomer
                                        # 

        it 'returns false if no objectives have started', ->

            objective.rootWaiting.should.equal false

        it 'returns the next deferral if a new root objective is started', (done) ->

            objective.loadAsRoot = true
            objective ->
            objective.rootWaiting.then -> done()
            delete objective.loadAsRoot

        xit 'objectives are queued', ->

            objective.loadAsRoot = true
            objective -> console.log 1
            objective -> console.log 2
            delete objective.loadAsRoot
            objective.rootWaiting
            objective.rootWaiting
            # not yet


    context 'childWaiting', ->

        it 'is an objective deferral queue for children', ->

        it 'returns false if no objectives are waiting', ->

            objective.childWaiting.should.equal false

        it 'returns the next deferral if new child is started', ->

            # console.log objective

            #objective ->

