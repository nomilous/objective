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

    console.log 'running!'


    before -> # doing nothing in root before and after hooks


    after ->  # if present, these will run, even if no it(s)


              #
              # modules from lib/ or src/ can be injected
              #    (here eg. src/something_classy.coffee)
              #           ie. searches by name with sen-
              #                                         sible
              #                                         deLimiter

    beforeEach (SomethingClassy) ->


        # create a mockable instance of Lloyd Blankfein
        #                                (some banker)
        #

        mock 'lloyd', new SomethingClassy 'Lloyd Blankfein'

        #
        # this mock instance encroach can now be injected into
        # all decendant test nodes
        #
        # AND
        #
        # it has a .does() function to create expectations
        # 
        # specifically function expectations
        # 




    mock 'he', it  # just because it's possible........


    context 'during the day', (he) -> # .....to do this


      # it 'eats', (....
        he 'eats', (done, lloyd) ->

                            #
                            # see how lloyd got injected
                            #
                            # 
                            #


            lloyd.does(     # .........  These

                eat: -> 'food'

                # whole: ->

                # bunch: ->

            )               # .........  brackets

            # having just replaced lloyd's eat method with an
            # expectation that he will eat before the test is
            # out

            setTimeout done, 200

            #
            # this test will fail
            # -------------------
            # 
            # 1. if eat() was not called before done
            # 2. if eat() was called more than once
            # 3. encroach
            #

            #
            # Answer: 2
            # 
            # ExpectationError: Function expectations were not met
            # 
            # {
            #   "lloyd [SomethingClassy]": {
            #     "functions": {
            #       "eat()": "PROBLEM - ran 4 times of expected 1"
            #     }
            #   }
            # }
            # 
            # 
            # Because lloyd eats twenty times a second
            #                        (see constructor)



        he 'works very hard', (lloyd, should) ->


            lloyd.does(         # .........  aren't

                work: (hard) -> 

                    hard.should.equal true

                    @relax()

                relax: ->

                    throw (
                        e  = new Error 'No rest for the wicked!'
                        e.extraInfo = 'zerozerozeroseroseyrosey'
                        e
                    )
            
            )                  # .........  necessary!


            lloyd.work true

            #
            # this test will fail
            # -------------------
            # 
            # 1. because relax was called
            # 2. and
            # 3. that means 'he' is not working very hard
            #

            #
            # Answer: 1
            # 
            # FAILED during the day + works hard
            # ExpectationError: Exception in expectation
            # {
            #    "lloyd [SomethingClassy]": {
            #       "functions": {
            #          "work()": {
            #             "OK": "Ran 1 times as expected"
            #          },
            #          "relax()": {
            #             "ERROR": "Error: No rest for the wicked!",
            #             "error": {
            #                "extraInfo": "zerozerozerozeroseyrosey"
            #             }
            #          }
            #          "encroach()": {
            #               "OK": "Ran 0 times as exspectred"
            #          }
            #       }
            #    }
            # }                                           still working
            #                                             on the result
            #                                             presentatio n
            #                                  ps.           
            #                                             perhaps there
            #                                             is too much i
            #                                             n f o rmation
            #


    context 'during the night', ->


        it 'lets us spy on lloyd sleeping', -> ''

        