require('./lib/objective')

    uuid: 'c3de2b6b-3450-493e-a5d9-e6d500254f01'
    title: ''
    description: ''
    private: true
    plugins: ['objective-dev']

.run (e) ->

    return console.log e if e?

    {prompt, recurse, pipe} = objective

    # pipe.on 'files.recurse.load?', (file, next) ->
    #     next()

    # pipe.on 'files.watch.reload?', (file, next) ->
    #     console.log v:file
    #     next()

    # pipe.on 'files.recurse.load.fatal?', ({error, file}, next) ->
    #     next()
    #

    dev.testDir = 'spec'
    dev.sourceDir = 'src'
    dev.compileTo = 'lib'

    recurse ['spec', 'src'], create: true, (e) ->

        console.log e if e?
    
        prompt()
