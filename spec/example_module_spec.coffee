objective 'ExampleModule',

    uuid: '0b6f64db-4a7d-46bd-8669-bd2cc91119ac'
    description: ''
    private: true
    plugins: ['objective-dev']

.run ->

    before -> 

    afterEach -> 

    beforeEach -> 

    describe 'Outer describe 1', ->

    context 'Outer context 2', ->

        afterEach -> 

        context 'Inner context 1', ->

            afterEach -> 

            it 'test 1', ->

            it 'test 2', ->

            it 'test 3', ->

            it 'test 4', ->

        context 'Inner context 2', ->

    describe 'Outer describe 3', ->

    afterEach -> 
    
    after ->

    afterAll ->

    after

        each: ->

        all: ->
