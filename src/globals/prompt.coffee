{createEvent, emit} = require './pipeline'

createEvent 'prompt.commands.register.ask'

keypress = require 'keypress'

fs = require 'fs'

{normalize, sep} = require 'path'

command = ''

prePrompt = '> '

postPrompt = ''

promptWidth = prePrompt.length

offset = 0

searching = false

running = false

bell = ->  process.stdout.write '\u0007'

commands = 'help':

    # build the help command in
    
    run: (args, callback) -> 

        showHelp args, callback

    help: """

    "hope this helps"

    """

    autoComplete: (args, callback) ->

        # help autocomplete 2nd arg from all possible commands

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
    console.log "help [command]           Per command help."
    console.log()   

    for cmd of commands

        process.stdout.write cmd
        process.stdout.cursorTo 25
        console.log commands[cmd].description || 'No description.'

    callback()

# log = console.log

# timeouts = []

# console.log = ->

#     clearTimeout for timeout in timeouts

#     log.apply null, arguments

#     timeouts.push setTimeout (->

#         writePrompt() unless running

#     ), 100

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

    # person entered key, confangled to support arrow reposition (offset) of cursor
    # to insert text in the middle of command

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
                if err? 
                    console.log()
                    console.log "#{err.toString()}"
                else
                    console.log()
                    console.log res if res?
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

autoCompleteStartsWith = (args, array) ->

    if array.length == 0 then array = null

    part = try args[args.length - 1]

    part ||= ''

    # using the partially completed last argument

    accum = ''

    if part.length > 0

        newArray = []

        # assemble newArray with autocompletion possibilities that match

        array.map (word)->

            newArray.push word if word.indexOf(part) == 0

        return [newArray[0], true, newArray] if newArray.length == 1

        if newArray.length != 0

            array = newArray

        else

            # nothing matches

            bell()
            return [null, false, []]


    shortest = 1000

    for word in array

        shortest = word.length unless shortest < word.length

    # match by column through the array to find the longest common match

    for col in [0..shortest]

        letter = undefined

        for word in array

            continue unless word[col]

            letter ||= word[col]

            if letter != word[col]

                return [accum, false, array]

        accum += letter if letter?

    # accumulated longest common match so return the 
    # accumulated match and a flag indicating an exact match
    # and the remaining possible autocompletions an array 

    return [accum, false, array]

writeAutoCompletePosibilities = (array, type) ->

    if type == 'path'

        nextPaths = for path in array

            parts = path.split sep

            last = parts.length - 1

            if parts[last] == ''

                path = parts[last - 1] + sep

            else

                path = parts[last]

        console.log "\n\n#{nextPaths.join '\n'}"

        return

    console.log "\n\n#{array.join '\n'}"

autoCompleteAssemble = (possibles, args, completion, [part, fullMatch, matches]) ->

    return unless part?

    type = undefined

    try type = completion.type

    if fullMatch

        command = command.substr 0, command.length - args[args.length - 1].length
        command += part + ' '
        process.stdout.clearLine()
        process.stdout.cursorTo 0
        writePrompt()
        lastPart = undefined
        return

    if part.length == 0

        writeAutoCompletePosibilities possibles, type
        writePrompt true
        lastPart = undefined
        return
    

    if part == lastPart

        writeAutoCompletePosibilities matches, type
        console.log()

    lastPart = part
    command = command.substr 0, command.length - args[args.length - 1].length
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

    if commands[cmd]? and args.length > 0

        # got command and some arguments so ask the plugin for autocomplete posibilities

        commands[cmd].autoComplete ||= -> bell(); null

        try commands[cmd].autoComplete args, (err, possibles) ->

            if err?

                console.log()
                console.log "Error in autoComplete #{err.toString()}"
                command = ''
                writePrompt true
                return

            unless possibles 

                bell()
                return

            if possibles.constructor.name == 'Array'

                # autocomplete from array of possibilities

                return autoCompleteAssemble possibles, args, null, autoCompleteStartsWith args, possibles

            return unless possibles.type == 'path'

            # plugin has specified to autocomplete from directory so 

            path = args[args.length - 1]

            parts = path.split sep

            file = parts.pop()

            path = parts.join(sep) + sep

            if path == sep

                unless args[args.length - 1][0] == '/'  # windows..!

                    path = '' unless args[args.length - 1] == sep

            try

                stat = fs.lstatSync path

                if stat.isDirectory()

                    path = normalize path + sep

            catch

                path = '.' + sep

            possibilities = []

            contents = fs.readdirSync path

            for f in contents

                f = normalize path + sep + f

                try
                    
                    stat = fs.lstatSync f

                    f += sep if stat.isDirectory()

                    if possibles.onlyDirectories

                        possibilities.push f if stat.isDirectory()
                        continue

                    possibilities.push f

                catch e
                    
                    console.log()
                    console.log "Error in autoComplete #{e.toString()}"
                    writePrompt true

            if possibilities.length == 0

                bell()
                return

            autoCompleteAssemble possibilities, args, possibles, autoCompleteStartsWith args, possibilities

            type = possibles.type || ''

            if type == 'path'

                unless args[args.length - 1].length == 0

                    if command.match /\/\s$/

                        command = command.substr 0, command.length - 1
                        process.stdout.clearLine()
                        process.stdout.cursorTo 0
                        writePrompt()

        catch err

            console.log()
            console.log "Error in autoComplete #{err.toString()}"
            console.log err.stack
            command = ''
            writePrompt true

        return
    

    # got no full command so accumulate possibilities from commands  

    possibilities = (for cmd of commands
        cmd )

    autoCompleteAssemble possibilities, [command], null, autoCompleteStartsWith [command], possibilities

    if command.match /\s$/

        # matched a full command so show usage

        cmd = command.substr 0, command.length - 1

        for line in commands[cmd].help.split '\n'

            if line.match /Usage\:/

                process.stdout.clearLine()
                process.stdout.cursorTo 0
                console.log line
                console.log()


        commands[cmd].autoComplete [''], (err, res) ->

            if res.type == 'path' and res.startIn?

                # the plugin says the type is path and has a default starting path so
                # push the starting path onto the command

                command = cmd + ' ' + res.startIn

            process.stdout.clearLine()
            process.stdout.cursorTo 0
            writePrompt()

    

historyFile = process.env.HOME + '/.objective/command_history'

historyCursor = 0

latestCommand = ''

history = try fs.readFileSync(historyFile).toString().trim().split '\n'

history ||= []

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

    unless found
        command = command.substr 0, command.length - 1
        postPrompt = '\':'
        bell()

    process.stdout.clearLine()
    process.stdout.cursorTo 0
    writePrompt false

endSearch = ->

    command = history[searchLine - 1] or ''
    command = '' if postPrompt.length < 3
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

    # confangled to delete chars from middle of command

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

    # create registrar and emit for listening modules to 
    # register their command line functions

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

        # all modules registered commands ok, hijack raw stdin and start the prompt

        keypress process.stdin

        process.stdin.setRawMode true

        process.stdin.on 'keypress', (ch, key) ->

            return if running # a command is running, TODO: ^c (to stop somehow)

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
        console.log()
        console.log "    help . . provides"
        console.log "    tab  . . auto-completes command ((Twice)"
        console.log "    ^c . . . quits or clears line"
        console.log "    ^r . . . reverse searches command history"
        console.log "             (tab chooses, return runs)"
        console.log()
        console.log()

        writePrompt()

