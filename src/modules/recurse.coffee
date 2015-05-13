{createEvent, emit} = require '../pipeline'
{pipeline, deferred} = require 'also'
{normalize} = require 'path'
mkpath = require 'mkpath'
fs = require 'fs'

createEvent 'recurse.start'
createEvent 'recurse.entering'
createEvent 'recurse.found'
createEvent 'recurse.end'
createEvent 'recurse.error'

module.exports = (paths, optionsORcallback, callback) ->

    options = optionsORcallback

    if typeof optionsORcallback == 'function'

        callback = optionsORcallback

        options = {}

    unless paths.constructor.name == 'Array'

        paths = [paths]

    pipeline(

        for path in paths

            do (path) -> deferred ({resolve, reject}) ->

                emit 'recurse.start', 

                    path: path

                    (err, res) ->

                        return reject err if err?
                
                        recurse [path], options, (err, res) ->

                            return reject err if err?

                            emit 'recurse.end',

                                path: path

                                -> resolve res

    ).then(

        (result) -> callback null, result

        (error) -> 

            emit 'recurse.error', error, ->

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

                emit 'recurse.entering',

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

                                    emit 'recurse.found',

                                        path: file

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



