objective
    
    title: '__TITLE__'
    uuid: '__UUID__'
    description: ''
    repl: listen: '/tmp/socket-__UUID__'
    once: false
    plugins: 
        'objective_dev':
            sourceDir: 'lib'
            testDir: 'test'
            testAppend: '_test'
            runAll: true
            showTrace: false
            filterTrace: false

.run ->

