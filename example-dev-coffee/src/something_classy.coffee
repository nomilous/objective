module.exports = class SomethingClassy

    constructor: (@name) ->

        # instance property (public)

        @flashyCar = 'wife got a poodle?'

        @eatInterval = setInterval (=>@eat()), 500


    # instance methods

    eat: ->

    work: ->

    sit: -> '-h--'

    sleep: -> "goodnight #{@name}"


    # class methods

    @rushHour: ->

