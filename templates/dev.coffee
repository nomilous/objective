objective
    
    title: '__TITLE__'
    uuid: '__UUID__'
    description: ''
    repl: listen: '/tmp/socket-__UUID__'
    plugins: 
        'objective_dev':
            testDir: 'test'
            testAppend: '_test'
            sourceDir: 'lib'
            runAll: true
            showTrace: false
            filterTrace: false

.run (recurse) ->

    ### search for files to watch / run tests on changes ###

    recurse ['lib', 'spec'], createDir: true
    .then ->

