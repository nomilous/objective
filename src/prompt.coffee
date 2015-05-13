keypress = require 'keypress'

fs = require 'fs'

command = ''

promptWidth = '> '.length

offset = 0

writePrompt = (newline) ->

    return process.stdout.write "\n> " + command if newline
    process.stdout.write "> " + command

appendToCommand = (char) ->

    chars = []
    chars.push ch for ch in command
    chars.splice command.length - offset, 0, char
    command = chars.join ''
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt()
    process.stdout.cursorTo command.length - offset + promptWidth

runCommand = ->

    historyCursor = 0
    command = command.trim()
    return writePrompt true if command.length == 0

    process.stdout.write '\n'
    console.log run: command
    history.push command
    history.shift() while history.length > 2000   # configurable
    command = ''
    writePrompt true

autoComplete = ->

    offset = 0
    console.log 'TODO: autocomplete'
    writePrompt true

historyFile = process.env.HOME + '/.objective/command_history'

historyCursor = 0

history = []

history = try fs.readFileSync(historyFile).toString().trim().split '\n'

process.on 'exit', -> try fs.writeFileSync historyFile, history.join '\n'

console.log history

historySearch = ->

    console.log 'TODO: history search'
    writePrompt true

historyScroll = (direction) ->

    switch direction

        when 'up'

            position = history.length - 1 - historyCursor
            historyCursor++ unless position == 0
            command = history[position]
            process.stdout.clearLine()
            process.stdout.cursorTo 0
            writePrompt false

        when 'down'

            position = history.length - 1 - historyCursor
            historyCursor-- unless position >= history.length
            command = history[position]
            process.stdout.clearLine()
            process.stdout.cursorTo 0
            writePrompt false


cursorScroll = (direction) ->

    position = command.length - offset

    switch direction

        when 'left'

            unless position == 0

                offset++
                position--
                process.stdout.cursorTo position + promptWidth

        when 'right'

            unless position >= command.length

                offset--
                position++
                process.stdout.cursorTo position + promptWidth

            

module.exports = (done) ->

    keypress process.stdin

    process.stdin.setRawMode true

    process.stdin.on 'keypress', (ch, key) ->

        unless key?

            return appendToCommand ch

        if ch? and ch.match /^[a-zA-Z0-9_]*$/

            return appendToCommand ch

        try if key.ctrl and (key.name == 'c' or key.name == 'd')

            if command.length > 0 

                command = ''
                return writePrompt true

            # TODO: pipe emit 'quit'

            try done()
            return process.exit 1

        try if key.name == 'return'

            return runCommand() if command.length > 0
            return writePrompt true

        if ch? and ch == ' '

            return appendToCommand ch

        try if key.name == 'tab'

            return autoComplete()

        try if key.name == 'backspace'

            return if command.length == 0
            command = command.substr 0, command.length - 1
            process.stdout.clearLine()
            process.stdout.cursorTo 0
            writePrompt()
            return

        try if key.ctrl and key.name == 'r'

            return historySearch()

        try if key.name == 'up' or key.name == 'down'

            return historyScroll key.name

        try if key.name == 'left' or key.name == 'right'

            return cursorScroll key.name

        # console.log ch: ch

        # console.log key: key

    writePrompt()