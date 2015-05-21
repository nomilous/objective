objective 'Test',

    uuid: '213d1a0d-8b89-417c-9904-fdd24002c0c4'
    description: ''
    private: true
    plugins: ['objective-dev']

.run (e) ->

    return console.log e if e?

    context '', -> it ''
