objective 'ExampleModule',

    uuid: '0b6f64db-4a7d-46bd-8669-bd2cc91119ac'
    description: ''
    private: true
    plugins: ['objective-dev']

.run (e) ->

    return console.log e if e?


    before -> console.log 'outer before all'

    afterEach -> console.log '1 SHOULD SEE THIS THREE TIMES'

    beforeEach -> console.log '1 ALSO 3 times'


    # xdescribe 'Outer describe 1', ->

    #     console.log 'Outer describe 1'




    describe 'Outer context 2', ->

        console.log 'Outer context 2'

        afterEach -> console.log '2 SHOULD SEE THIS THREE TIMES'

        context 'Inner context 1', ->

            console.log 'Inner context 1'

            afterEach -> console.log '3 SHOULD SEE THIS THREE TIMES'

            it 'test 1', ->
                console.log 'test 1'
                # throw new Error 'In Test'

            # it.only 'test 2', ->

            #     console.log 'test 2'

            it 'test 3', ->
                console.log 'test 3'

            it 'test 4', ->
                console.log 'test 4'


        # context 'Inner context 2', ->

        #     console.log 'Inner context 2'


    # xdescribe 'Outer describe 3', ->

    #     console.log 'Outer describe 3'




    # afterEach -> console.log 'outer after each'
    

    after -> console.log 'outer after all'

