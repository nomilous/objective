uuid: '42394647-58d4-47de-9370-0a1e46b5886e'
title: ''
description: ''
private: true
modules: ['objective-dev', '../../socket.io.pp', 'moo-too', 'help_s']
root: (done) ->

    dev.testDir = 'spec'
    dev.sourceDir = 'src'
    dev.compileTo = 'lib'

    recurse ['spec', 'src'], create: true, prompt done

    