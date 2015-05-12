{ipso} = require 'ipso'

describe 'Run', ->

    xit 'defaults to load the objective. file',

        ipso (done, fs, Run) ->

            fs.does

                lstatSync: (file) -> 

                    file.should.equal 'objective.js'
                    throw new Error()

            Run.do {}, ->



    it 'loads the objective file', 

        ipso (done, fs, Run) ->

            fs.does

                readFileSync: (file) ->

                    file.should.equal 'filename.coffee'

                    done()

                    '->'

            Run.do file: 'filename.coffee', ->
