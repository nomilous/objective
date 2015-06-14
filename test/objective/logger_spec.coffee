describe 'Logger', ->

    require '../../'

    it 'defines error, warn, info, createDebug', ->

        objective.logger.error.should.be.an.instanceOf Function
        objective.logger.warn.should.be.an.instanceOf Function
        objective.logger.info.should.be.an.instanceOf Function
        objective.logger.createDebug.should.be.an.instanceOf Function

    it 'logs', ->
        
        objective.logger.error(
            'testing error', new Error('No problem.')
        )
