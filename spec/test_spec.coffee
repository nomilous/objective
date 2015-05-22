objective 'Test',

    uuid: '213d1a0d-8b89-417c-9904-fdd24002c0c4'
    description: ''
    private: true
    plugins: ['objective-dev']

.run ->

    before -> console.log 'BEFORE'

    beforeEach -> console.log 'BEFORE EACH'

    describe 'DESCRIBE', ->

        before -> console.log 'before inner'

        beforeEach -> console.log 'before each inner'

        context 'CONTEXT', ->

            it 'ONE', ->

            it 'TWO', ->

        afterEach -> console.log 'after each inner'

        after -> console.log 'after inner'

    afterEach -> console.log 'AFTER EACH'

    after -> console.log 'AFTER'
