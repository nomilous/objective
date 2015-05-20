{pipeline, deferred} = require 'also'

# middleware style event pipeline

{debug} = require '../logger'

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

        pipeline(
        
            for fn in pipe

                do (fn) -> deferred (action) ->

                    debug "pipeline event handler running event '#{event}'"

                    fn payload, action.resolve

        ).then(

            (result) ->

                debug "pipeline event '#{event}' done ok"

                callback null, payload

            (error) ->
                
                debug "pipeline event '#{event}' failed #{error.toString()}"

                callback error

            (notify) ->

        )

    on: (event, fn) ->

        debug "pipeline registering handler on event '#{event}'"

        Pipeline.pipes[event] ||= []

        Pipeline.pipes[event].push fn

