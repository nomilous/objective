{pipeline, deferred} = require 'also'

# middleware style event pipeline

{error, debug, TODO, info} = require '../logger'

TODO 'report on hung pipes at program exit'

TODO 'queued pipeline'

module.exports = Pipeline =

    pipes: {}

    createEvent: (event) -> 

        debug "pipeline created event '#{event}'"

        Pipeline.pipes[event] ||= []

    emit: (event, payload, callback) ->

        unless pipe = Pipeline.pipes[event]

            return callback new Error "No handlers for '#{event}'."

        debug "pipeline emitted event '#{event}'"

        # TODO: fix left promises hanging when middleware doesnt call next

        cancelled = false

        cancelledReason = 'reason unspecified'

        pipeline(
        
            for fn in pipe

                do (fn) -> deferred (action) ->

                    debug "pipeline event handler running event '#{event}'"

                    #fn payload, action.resolve

                    objective.injector

                        args: [payload]

                        next: action.resolve

                        onError: action.reject

                        cancel: (reason) ->

                            cancelledReason = reason if reason?
                            cancelled = true
                            action.reject()

                        fn

        ).then(

            (result) ->

                debug "pipeline event '#{event}' done ok"

                callback null, payload

            (err) ->

                if cancelled

                    # no callback on cancelled

                    info "pipeline event '#{event}' cancelled because '#{cancelledReason}'"

                    return

                console.log err.stack
                
                error "pipeline event '#{event}' failed #{err.toString()}"

                callback err

            (notify) ->

        )

    on: (event, fn) ->

        debug "pipeline registering handler on event '#{event}'"

        Pipeline.pipes[event] ||= []

        Pipeline.pipes[event].push fn

