objective ->

    before (moo) ->

    it '', -> 1

    mock()

    it()

    it.only() # runs only this it (and others with .only)

    xit() # skip this it

    # xit.only() # you what?

    before() # (beforeAll) - also supports {each:fn,all:fn}

    beforeEach()

    beforeAll() # same as before

    beforeEach() # can
    beforeEach() # repeat
    beforeEach() # hooks (they'l'l run in sequence)

    context()

    describe()

    context.only() # runs only context (and other tests with only)

    describe.only()

    xdescribe() 

    context()

    xcontext()

    after() # (afterAll) - also supports {each:fn,all:fn}

    afterEach()

    afterAll() # same as after

    xbefore()

    xbeforeEach()

    xbeforeAll()

    xafter()

    xafterEach()

    xafterAll()

