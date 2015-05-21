
{debug, info, error, TODO} = require '../logger'

{util} = require 'also'

TODO 'injection aliases from config'

module.exports = (opts, fn) ->

    if typeof opts == 'function'

        fn = opts

        opts = {}

    opts.args ||= []

    args = util.argsOf fn

    runWithArgs = []

    handlingError = false

    handlingNext = false

    for arg in args

        debug "with arg #{arg}"

        if arg == 'e' or arg == 'er' or arg == 'err' or arg == 'error'

            debug "injecting error"

            runWithArgs.push opts.error || null

            handlingError = true

        else if arg == 'next' or arg == 'done'

            debug "injecting next"

            runWithArgs.push opts.next || ->

            handlingNext = true

        else if arg == 'cancel'

            debug "injecting cancel"

            runWithArgs.push opts.cancel || ->

        else if objective.globals.indexOf(arg) >= 0

            debug "injecting global '#{arg}'"

            runWithArgs.push objective[arg]

        else if opts.args.length > 0

            debug "injecting arg"

            runWithArgs.push opts.args.pop()

        else

            debug "injecting module '#{arg}'"

            try

                runWithArgs.push require arg

            catch e

                if opts.onError then opts.onError e
                else error e

    if opts.error? and not handlingError

        error opts.error.stack

    promise = fn.apply null, runWithArgs

    opts.next() if typeof opts.next == 'function' and not handlingNext

    return promise
