objective '__TITLE__', (recurse) ->

    ### search for files to watch / run tests on changes ###

    recurse ['lib', 'spec'], createDir: true
    .then ->