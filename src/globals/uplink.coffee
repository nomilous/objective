return

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

        socket.on 'connect_error', (e) -> console.log 'connect error', e.toString()

        socket.on 'connect_timeout', -> console.log 'timeout'

        socket.on 'connect', ->

            socket.emit 'auth',

                version: version
                objective: objective
                key: key

        socket.on 'reconnect', (n) -> console.log 'reconnected ' + n

        socket.on 'reconnect_attempt', -> console.log 'reconnect attempt'

        socket.on 'reconnecting', (n) -> console.log 'reconnecting ' + n

        socket.on 'reconnect_error', (e) -> console.log 'reconnect error', e.toString()

        socket.on 'reconnect_failed', -> console.log 'reconnect failed after reconnectionAttempts'




        socket.on 'auth.good', ({online_users}) -> 

            console.log "online now: #{JSON.stringify online_users}"
            callback()

        socket.on 'auth.bad', -> 

            callback new Error 'Bad key or objective uuid.'

        socket.on 'auth.err', callback

        socket.on 'auth.banner', (message) -> 

            callback new Error message



        socket.on 'user.joined', (user) ->

            console.log "user joined: #{JSON.stringify user}"

        socket.on 'user.left', (user) ->

            console.log "user left: #{JSON.stringify user}"


    disconnect: ->

        socket.disconnect()

