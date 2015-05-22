objective 'SomethingClassy',

    uuid: '04f92eba-3400-401e-befa-ea78ab5dd895'
    description: ''
    private: false
    plugins: ['objective-dev']

                        #
                        # Config: What a mission?
                        # 
                        # a) true
                        # b) false
                        # c) NaN
                        # d) undefined is not a function
                        #
                        

.run ->


            # modules from lib/ or src/ can be injected
            #     (here eg. src/something_classy.coffee)
            #           ie. searches by name with sen-
            #                                         sible
            #                                         deLimiter

    beforeEach (SomethingClassy) ->


        # create a mockable instance of Lloyd Blankfein


        mock 'lloyd', new SomethingClassy 'Lloyd Blankfein'


        # this mock instance encroach can now be injected into
        # all decendant test nodes



    context 'during the day', ->


        it 'eats', (done, lloyd) ->

                            #
                            # see how lloyd got injected
                            #


            lloyd.does eat: -> 'food'

            # having just replaced lloyd's eat method with an
            # expectation that he will eat before the test is
            # out

            setTimeout done, 1000

            # this test will fail
            # -------------------
            # 
            # 1. if eat() was not called before done
            # 2. if eat() was called more than once
            # 3. encroach

            # Answer: 2
            #
            # ExpectationError: Too many calls to function 'eat()'
            #
            # Because lloyd eats twice a second



    context 'during the night', ->


        it 'lets us spy on it sleeping', ->


