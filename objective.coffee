# plugin = 

#     name: 'thing'

#     init: (callback) ->

#         {pipe} = objective

#         pipe.on 'prompt.commands.register.ask', (command, next) ->

#             command.create 'moo',

#                 run: (args, callback) ->

#                     console.log 'moo'

#                     setTimeout callback, 1000



#             next()

#         callback()



objective 'Objective Name',

    uuid: 'c3de2b6b-3450-493e-a5d9-e6d500254f01'
    description: ''
    private: true
    # plugins: [plugin, 'objective-dev']
    plugins: ['objective-dev']

.run (prompt, recurse, pipe) ->


    # # pipe.on 'files.recurse.load?', (file, next) ->
    # #     next()

    # # pipe.on 'files.watch.reload?', (file, next) ->
    # #     console.log v:file
    # #     next()

    # # pipe.on 'files.recurse.load.fatal?', ({error, file}, next) ->
    # #     next()
    # #

    # pipe.on 'dev.test.before.all', ({tree}, next) ->

    #     next()

    # pipe.on 'dev.test.after.all', (stuff, next) ->

    #     # console.log stuff

    #     next()

    # pipe.on 'dev.test.before.each', ({test}, next) ->

    #     # console.log '-------------------'
    #     # console.log test if test.type == 'test'
    #     # console.log '-------------------'
    #     next()

    # pipe.on 'dev.test.after.each', ({test}, next) ->

    #     # setTimeout next, 1000

    #     if test.type != 'test'

    #         console.log test

    #     next()

    dev.testDir = 'spec'
    dev.sourceDir = 'src'
    dev.compileTo = 'lib'

    recurse ['spec', 'src'], createDir: true, (e) ->

        console.log e if e?

        dev.reporters.default()
    
        prompt()
