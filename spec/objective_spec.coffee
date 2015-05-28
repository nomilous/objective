{ipso} = require 'ipso'

describe 'Objective', ->


    it 'is global', ipso (Objective) ->

        (objective?).should.equal true


    it 'is can run with multiple arg combinations', ipso (Objective) ->

        Objective.does run: -> arguments.should.eql

            '0': title: 'Untitled Objective'
            '1': undefined

        Objective()


    it 'is can run with multiple arg combinations', ipso (Objective, should) ->

        Objective.does _run: -> arguments.should.eql

            '0': title: 'Title'
            '1': undefined

        result = Objective 'Title'

        should.exist result.run


    it 'is can run with multiple arg combinations', ipso (Objective, should) ->

        Objective.does _run: -> 

            arguments[0].should.eql

                title: 'Untitled Objective'

            (typeof arguments[1] == 'function').should.equal true

        result = Objective ->

        should.not.exist result.run


    it 'is can run with multiple arg combinations', ipso (Objective, should) ->

        Objective.does _run: -> arguments.should.eql

            '0': title: 'Title', config: 'option'
            '1': undefined

        result = Objective 'Title', {config: 'option'}

        should.exist result.run


    it 'is can run with multiple arg combinations', ipso (Objective, should) ->

        Objective.does _run: -> 

            arguments[0].should.eql

                title: 'Title'
                config: 'option'

            (typeof arguments[1] == 'function').should.equal true

        result = Objective 'Title', {config: 'option'}, ->

        should.not.exist result.run
