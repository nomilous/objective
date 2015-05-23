objective 'Untitled',

    uuid: '37e72020-a8ce-45cd-b8af-fd97eed3771e'
    description: ''
    private: false
    plugins: ['objective-dev']

.run (recurse, prompt) ->

    dev.testDir = 'spec'
    dev.sourceDir = 'src'
    dev.compileTo = 'lib'
    dev.expectorName = 'does'

    recurse ['spec', 'src'], createDir: true, (e) ->

        console.log e if e?

        dev.reporters.default()
    
        prompt()