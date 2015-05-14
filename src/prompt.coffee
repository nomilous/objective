{createEvent, emit} = require './pipeline'

console.log 'todo: fix ^r then enter on empty result running command'

createEvent 'prompt.commands.register.ask'

keypress = require 'keypress'

fs = require 'fs'

{normalize} = require 'path'

command = ''

prePrompt = '> '

postPrompt = ''

promptWidth = prePrompt.length

offset = 0

searching = false

running = false

bell = ->  process.stdout.write '\u0007'

commands = 'help': 
    
    run: (args, callback) -> 

        showHelp args, callback

    help: """

    "hope this helps"

    """

    autoComplete: (args, callback) ->

        callback null, (for cmd of commands

            cmd
        )

showHelp = (args, callback) ->

    if args.length > 0

        cmd = args[0]

        unless commands[cmd]?

            console.log """

            #{cmd} does not exist

            """
            return callback()

        console.log commands[cmd].help || """

        no help for #{cmd}

        """
        return callback()

    console.log()
    console.log "help [command]           Per command help"
    console.log()   

    for cmd of commands

        process.stdout.write cmd
        process.stdout.cursorTo 25
        console.log commands[cmd].description || 'No description.'

    callback()

setPrompt = (newPrompt) ->

    prePrompt = newPrompt
    promptWidth = prePrompt.length


writePrompt = (newline) ->

    if newline
        process.stdout.write "\n" + prePrompt + command + postPrompt
    else
        process.stdout.write prePrompt + command + postPrompt
    process.stdout.cursorTo promptWidth + command.length

appendToCommand = (char) ->

    chars = []
    chars.push ch for ch in command
    chars.splice command.length - offset, 0, char
    command = chars.join ''
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt()
    process.stdout.cursorTo command.length - offset + promptWidth

    updateSearch() if searching

runCommand = ->

    command = command.trim()
    return writePrompt true if command.length == 0

    running = true

    args = command.split ' '

    cmd = args[0]
    args = args[1..]

    if commands[cmd]?

        history.unshift command unless history[0] == command
        history.pop() while history.length > 2000            # make configurable
        console.log()
        command = ''
        
        try
            callback = (err, res) ->

                running = false
                if err? then return console.log "#{err.toString()}"
                if res? then return console.log res
                writePrompt true

            callback.write = (text) ->

                process.stdout.clearLine()
                process.stdout.cursorTo 0
                process.stdout.write text.toString()

            callback.writeLine = (text) ->

                console.log text

            commands[cmd].run args, callback

            return

        catch err

            running = false
            console.log "#{err.toString()}"

    else

        console.log "\n#{cmd}: command not found"
        command = ''
        running = false


    writePrompt true

lastPart = undefined

autoCompleteStartsWith = (part, array) ->

    part ||= ''

    accum = ''

    if part.length > 0

        newArray = [] 

        array.map (word)->

            newArray.push word if word.indexOf(part) == 0

        return [newArray[0], true, newArray] if newArray.length == 1

        if newArray.length != 0

            array = newArray

        else

            bell()
            return [null, false, []]


    for col in [0..99]

        letter = undefined

        for word in array

            letter ||= word[col]

            if letter != word[col]

                return [accum, false, array]

        accum += letter

    return [accum, false, array]

writeAutoCompletePosibilities = (array, type) ->

    if type == 'path'

        last = command.split(' ').pop()

        nextPaths = for path in array

            path.substr last.length

        console.log "\n\n#{nextPaths.join '\n'}"

        return

    console.log "\n\n#{array.join '\n'}"

autoCompleteAssemble = (possibilities, args, func, [part, fullMatch, matches]) ->

    return unless part?

    type = undefined

    try type = func.type

    if fullMatch

        command = command.substr 0, command.length - args[0].length
        command += part + ' '
        process.stdout.clearLine()
        process.stdout.cursorTo 0
        writePrompt()
        lastPart = undefined
        return

    if part.length == 0

        writeAutoCompletePosibilities possibilities, type
        writePrompt true
        lastPart = undefined
        return
    

    if part == lastPart

        writeAutoCompletePosibilities matches, type
        console.log()

    lastPart = part
    command = command.substr 0, command.length - args[0].length
    command += part
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt()

autoComplete = ->

    offset = 0

    if command.trim().length == 0

        showHelp [], ->
        writePrompt true
        return

    args = command.split ' '
    cmd = args[0]
    args = args[1..]

    if commands[cmd]?

        func = commands[cmd].autoComplete

        if typeof func == 'function'

            try commands[cmd].autoComplete args, (err, possibilities) ->

                if err?

                    console.log()
                    console.log "Error in autoComplete #{err.toString()}"
                    command = ''
                    writePrompt true

                if args.length > 1

                    console.log()
                    console.log "Only first argument cam be auto completed."
                    writePrompt true
                    return

                autoCompleteAssemble possibilities, args, func, autoCompleteStartsWith args[0], possibilities

            catch err

                console.log()
                console.log "Error in autoComplete #{err.toString()}"
                command = ''
                writePrompt true

        else if func.type == 'path'



            # path = func.startIn || ''

            # if func.startIn? and command.indexOf(func.startIn) < 0

            #     command = command + func.startIn
            #     process.stdout.clearLine()
            #     process.stdout.cursorTo 0
            #     writePrompt()

            

            args = command.split ' '
            cmd = args[0]
            args = args[1..]

            path = args[args.length - 1]

            console.log p: path

            possibilities = []

            contents = fs.readdirSync path

            for f in contents

                f = normalize path + '/' + f

                try
                    
                    stat = fs.lstatSync f

                    f += '/' if stat.isDirectory()

                    if func.ignoreFiles

                        possibilities.push f if stat.isDirectory()
                        continue

                    possibilities.push f

                catch e
                    
                    console.log()
                    console.log "Error in autoComplete #{err.toString()}"
                    writePrompt true

            autoCompleteAssemble possibilities, args, func, autoCompleteStartsWith args[0], possibilities

            if command.match /\/\s$/

                command = command.substr 0, command.length - 1
                process.stdout.clearLine()
                process.stdout.cursorTo 0
                writePrompt()

        return

    possibilities = (for cmd of commands
        cmd )

    autoCompleteAssemble possibilities, [command], null, autoCompleteStartsWith command, possibilities

    if command.match /\s$/

        cmd = command.substr 0, command.length - 1

        func = commands[cmd].autoComplete

        if func.type == 'path' and func.startIn?

            command = cmd + ' ' + func.startIn
            process.stdout.clearLine()
            process.stdout.cursorTo 0
            writePrompt()
    

historyFile = process.env.HOME + '/.objective/command_history'

historyCursor = 0

latestCommand = ''

history = []

history = try fs.readFileSync(historyFile).toString().trim().split '\n'

process.on 'exit', -> try fs.writeFileSync historyFile, history.join '\n'

historyScroll = (direction) ->

    switch direction

        when 'up'

            latestCommand = command if historyCursor == 0
            historyCursor++ unless historyCursor >= history.length

        when 'down'

            historyCursor-- unless historyCursor == 0

    command = history[historyCursor - 1] or latestCommand
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt()

historySearch = ->

    if searching

        return updateSearch searchLine

    searching = true
    command = ''
    setPrompt '(search)\''
    postPrompt = '\':'
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt()

searchLine = 0

updateSearch = (start = 0) ->

    searchLine = start

    if command.length == 0
        process.stdout.clearLine()
        process.stdout.cursorTo 0
        postPrompt = '\':'
        writePrompt false
        return

    found = false
    for i in [start..history.length]
        
        line = history[i] or ''
        position = line.indexOf command
        if position == -1
            searchLine++
            continue
        postPrompt = "': #{line}"
        searchLine++
        found = true
        break

    postPrompt = '\':' unless found

    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt false

endSearch = ->

    command = history[searchLine - 1] or ''
    postPrompt = ''
    setPrompt '> '
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt false
    searching = false


cursorScroll = (direction) ->

    position = command.length - offset

    switch direction

        when 'left'

            unless position == 0

                offset++
                position--

        when 'right'

            unless position >= command.length

                offset--
                position++

    process.stdout.cursorTo position + promptWidth

backspace = ->

    return if command.length == 0
    position = command.length - offset - 1
    return if position < 0
    chars = []
    chars.push char for char in command
    chars.splice position, 1
    command = chars.join ''
    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt()
    process.stdout.cursorTo position + promptWidth
    
    updateSearch() if searching


module.exports = (done) ->

    registrar = {}

    Object.defineProperty registrar, 'create',

        get: -> (name, config) ->

            if commands[name]?

                unless config.altname?

                    throw new Error "Command name collision on '#{name}'"

                name = config.altname

            # console.log register: name

            commands[name] = config
            
        

    emit 'prompt.commands.register.ask', registrar, (err, res) ->

        return done err if err?

        keypress process.stdin

        process.stdin.setRawMode true

        process.stdin.on 'keypress', (ch, key) ->

            return if running

            try if key.name == 'return'

                historyCursor = 0
                endSearch() if searching
                return runCommand() if command.length > 0
                return writePrompt true

            unless key?

                return appendToCommand ch

            if ch? and ch.match /^[a-zA-Z0-9_]*$/

                return appendToCommand ch

            try if key.ctrl and (key.name == 'c' or key.name == 'd')

                historyCursor = 0

                if searching
                    endSearch()
                    command = ''
                    process.stdout.clearLine()
                    process.stdout.cursorTo 0
                    writePrompt false
                    return

                try if command.length > 0

                    command = ''
                    return writePrompt true

                # TODO: pipe emit 'quit'

                try done()
                return process.exit 1

            if ch? and ch == ' '

                return appendToCommand ch

            try if key.name == 'tab'

                return endSearch() if searching
                return autoComplete()

            try if key.name == 'backspace'

                return backspace()

            try if key.ctrl and key.name == 'r'

                return historySearch()

            try if key.name == 'up' or key.name == 'down'

                return if searching
                return historyScroll key.name

            try if key.name == 'left' or key.name == 'right'

                return cursorScroll key.name

            # console.log ch: ch

            # console.log key: key

        console.log()
        console.log "    help . . gets some"
        console.log "    tab  . . auto completes command ((Twice)"
        console.log "    ^c . . . quits or clearsline"
        console.log "    ^r . . . reverse searches command history"
        console.log()
        console.log()

        writePrompt()

