return

{debug, info} = require '../logger'

user = require './user'

client = require 'socket.io-client'

fs = require 'fs'

user.load()

socket = undefined

version = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString()).version

module.exports = 

    connect: (objective, callback) ->

        {key} = user

        socket = client 'https://ipso.io'

        socket.on 'connect_error', (e) -> debug 'connect error', e.toString()

        socket.on 'connect_timeout', -> debug 'timeout'

        socket.on 'connect', ->

            socket.emit 'auth',

                version: version
                objective: objective
                key: key

        socket.on 'reconnect', (n) -> debug 'reconnected ' + n

        socket.on 'reconnect_attempt', -> debug 'reconnect attempt'

        socket.on 'reconnecting', (n) -> debug 'reconnecting ' + n

        socket.on 'reconnect_error', (e) -> debug 'reconnect error', e.toString()

        socket.on 'reconnect_failed', -> debug 'reconnect failed after reconnectionAttempts'




        socket.on 'auth.good', ({online_users}) -> 

            info "online now: #{JSON.stringify online_users}"
            callback()

        socket.on 'auth.bad', -> 

            callback new Error 'Bad key or objective uuid.'

        socket.on 'auth.err', callback

        socket.on 'auth.banner', (message) -> 

            callback new Error message



        socket.on 'user.joined', (user) ->

            debug "user joined: #{JSON.stringify user}"

        socket.on 'user.left', (user) ->

            debug "user left: #{JSON.stringify user}"


    disconnect: ->

        socket.disconnect()

