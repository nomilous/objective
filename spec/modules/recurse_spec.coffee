{ipso} = require 'ipso'

describe 'Recurse', ->
    
    it.only 'created the directories if create is true',

        ipso (done, Recurse, should, fs, path) ->

            Recurse 'directory', create: true, (e) ->

                stat = fs.lstatSync path.normalize process.cwd() + '/directory'

                fs.rmdirSync path.normalize process.cwd() + '/directory'

                stat.isDirectory().should.equal true

                done()



