{createEvent, emit} = require './pipeline'
{pipeline, deferred} = require 'also'
{normalize} = require 'path'
mkpath = require 'mkpath'
isBinaryFile = require 'isBinaryFile'
fs = require 'fs'

createEvent 'files.recurse.start'
createEvent 'files.recurse.entering'
createEvent 'files.recurse.found'
createEvent 'files.recurse.end'
createEvent 'files.recurse.error'
createEvent 'files.recurse.load?'
createEvent 'files.recurse.load.fatal?'
createEvent 'files.watch.reload?'

module.exports = (paths, optionsORcallback, callback) ->

    console.log "Recursing #{JSON.stringify paths}"

    options = optionsORcallback

    if typeof optionsORcallback == 'function'

        callback = optionsORcallback

        options = {}

    unless paths.constructor.name == 'Array'

        paths = [paths]

    pipeline(

        for path in paths

            do (path) -> deferred ({resolve, reject}) ->

                emit 'files.recurse.start', 

                    path: path

                    (err, res) ->

                        return reject err if err?
                
                        recurse [path], options, (err, res) ->

                            return reject err if err?

                            emit 'files.recurse.end',

                                path: path

                                -> resolve res

    ).then(

        (result) -> callback null, result

        (error) -> 

            emit 'files.recurse.error', error, ->

                callback error

    )


recurse = (paths, options, callback) ->

    pipeline(

        for path in paths

            do (path) -> deferred ({resolve, reject}) ->

                if path.match /^\//

                    return reject new Error 'Cannot recurse from root.'

                try
                
                    stat = fs.lstatSync path

                    unless stat.isDirectory()

                        return reject new Error 'Cannot recurse file ' + path

                catch e

                    return reject e unless e.errno == 34

                    return reject e unless options.create

                    try

                        mkpath.sync path

                    catch e

                        return reject e

                emit 'files.recurse.entering',

                    path: path

                    (err) ->

                        return reject err if err?

                        contents = fs.readdirSync path

                        files = []
                        directories = []

                        for f in contents

                            f = path + '/' + f

                            try

                                stat = fs.lstatSync f

                                if stat.isDirectory()

                                    directories.push f

                                    continue

                                files.push f

                            catch e

                                return reject e

                        pipeline(

                            for file in files

                                do (file) -> deferred ({resolve, reject}) ->

                                    emit 'files.recurse.found',

                                        path: file

                                        (err) ->

                                            return reject err if err?

                                            return resolve() if isBinaryFile file


                                            fs.watchFile file, interval: 100, (curr, prev) ->

                                                return unless prev.mtime < curr.mtime

                                                emit 'files.watch.reload?', file, (err) ->

                                                    return if err?

                                                    try

                                                        filename = process.cwd() + '/' + file
                                                        delete require.cache[filename]
                                                        require filename

                                                    catch e

                                                        console.log "\nError loading '#{filename}'"
                                                        console.log e.stack


                                            emit 'files.recurse.load?', file, (err) ->

                                                return resolve() if err?

                                                objective.loading = file

                                                try
                                                    
                                                    require process.cwd() + '/' + file

                                                    resolve()

                                                catch e
                                                    
                                                    return emit 'files.recurse.load.fatal?',

                                                        file: file
                                                        error: e

                                                        (err) ->

                                                            return reject err if err?
                                                            resolve()
                                                


                        ).then(

                            (result) -> 

                                recurse directories, options, (err, res) ->

                                    return reject err if err?

                                    resolve res

                            (error) -> reject error
                        )

    ).then(

        (result) -> callback null, result

        (error) -> callback error

        (notify) ->

    )



