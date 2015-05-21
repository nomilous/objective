{info, debug, error, TODO} = require '../logger'

module.exports.queues = queues = {}

module.exports.create = (name) ->

    throw new Error "Queue '#{name}' already exists." if queues[name]?

    queues[name] = 

        pending: []

        enque: (enqueued) ->

            ->
                queue = queues[name]

                queue.pending.push

                    args: arguments
                    fn: enqueued

                debug "queue '#{name}' enqueued at length #{queue.pending.length}"

                done = ->

                    queue.pending.shift()

                    debug "queue '#{name}' dequeued to length #{queue.pending.length}"

                    return unless queue.pending.length > 0

                    {args, fn} = queue.pending.shift()

                    # stack depth? problem?

                    inject = [done]

                    inject.push args[i] for i of args

                    fn.apply null, inject

                if queue.pending.length == 1

                    # adding only function onto queue
                    # run it now

                    inject = [done]

                    inject.push arguments[i] for i of arguments

                    enqueued.apply null, inject

    return queues[name]

module.exports.get = (name) ->

    return queues[name] || module.exports.create name

