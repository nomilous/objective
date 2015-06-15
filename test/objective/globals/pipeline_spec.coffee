describe 'Globals Pipeline', ->

    require '../../../'

    it 'defines on, emit, createEvent, startRun, pipes, runs', ->

        objective.pipeline.on.should.be.an.instanceOf Function
        objective.pipeline.emit.should.be.an.instanceOf Function
        objective.pipeline.createEvent.should.be.an.instanceOf Function

        objective.pipeline.runs.should.be.an.instanceOf Object
        objective.pipeline.pipes.should.be.an.instanceOf Object

        objective.pipeline.startRun.should.be.an.instanceOf Function
                              #
                              # internalize
                              #

    # it '', ->

    #     objective.pipeline.on 'event', (->), true


    it 'next'

    it 'cancel'

    it 'skip'

