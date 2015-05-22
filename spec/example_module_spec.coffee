objective 'ExampleModule',

    uuid: '0b6f64db-4a7d-46bd-8669-bd2cc91119ac'
    description: ''
    private: true
    plugins: ['objective-dev']

.run ->

    before ->

       # mock('obj').does

        #     function: ->

        # (done) -> setTimeout done, 1500

    afterEach ->

    beforeEach ->

        # mock('thing').does

        # mock('obj').does

    beforeEach -> 

        # mock('thing').does

        #     function2: ->

        # throw new Error 'Grumble'

    describe 'Outer describe 1', ->

        it 'with mocked obj', ->

            # mock('obj').does

            # mock('thing').does

            #obj.function()

        it 'again', ->

            #mock('thing').does

        context 'deeper', ->

            before ->

                # mock('thing').does



    xcontext 'Outer context 2', ->

        beforeEach -> # throw new Error 'F'

        context 'Inner context 1', (ExampleModule, Test) ->

            beforeEach ->

            it 'test 1', (done) ->

                ExampleModule.does

                    $$something: (one, two) ->

                        # console.log FIRST: "#{one} #{two}"

                ExampleModule.does

                    $$something: (one, two) ->

                        # console.log SECOND: "#{one} #{two}"

                Test.does

                    anotherThing: ->

                @timeout 100

                ExampleModule.something 'arg1', 'arg2'

                console.log E: ExampleModule.prototype.constructor.name

                console.log T: Test.constructor

                # ExampleModule.something 'arg3', 'arg4'

                Test.does

                    anotherThing: -> 

                        done()

                # Test.anotherThing()

                Test.anotherThing()


                # throw new Error 'Grumble'

            it 'test 2', ->


            it 'test 3', ->

            it 'test 4', (should) ->

                #1.should.equal 2

        context 'Inner context 2', ->

            it 'test 5', (assert) ->

                # console.log aa: assert

                # assert.deepEqual [], [2]

    describe 'Outer describe 3', ->

    afterEach -> 
    
    after ->

    afterAll ->

    after

        each: ->

        all: ->
