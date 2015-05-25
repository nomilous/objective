objective 'SomethingFactory'

    # # uuid: '729ccb54-2ed1-4b69-a34e-3730e4cc8b8f'
    # description: ''
    # private: false
    # plugins: ['objective-dev']

.run ->

    before (done) -> setTimeout done, 200

    it 'passes', -> 1

    it 'passes', -> 2

    context 'context', ->

        it 'fails', (should) -> 

            1.should.equal 2

    it 'pends', -> 
