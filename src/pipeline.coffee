{pipeline, deferred} = require 'also'

module.exports = Pipeline =

    pipes: {}

    createEvent: (event) -> Pipeline.pipes[event] ||= []

    emit: (event, payload, callback) ->

        unless pipe = Pipeline.pipes[event]

            return callback new Error "No handlers for '#{event}'."


        # TODO: fix left promises hanging when middleware doesnt call next


        pipeline(
        
            for fn in pipe

                do (fn) -> deferred (action) ->

                    fn payload, action.resolve

        ).then(

            (result) -> callback null, payload

            (error) -> callback error

            (notify) ->

        )

    on: (event, fn) ->

        Pipeline.pipes[event] ||= []

        Pipeline.pipes[event].push fn

