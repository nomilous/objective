describe 'ObjectiveArgument', ->

    should = require 'should'

    OArg = require('../../lib/objective/argument')

    context 'parse()', ->

        it 'parses function arguments and returns array', ->

            result = OArg.parse ->
            result.should.eql []

        it 'set each as instance of OArg', ->

            result = OArg.parse (a,b) ->

            result[0].should.be.an.instanceof OArg
            result[1].should.be.an.instanceof OArg

            result[0].name.should.equal 'a'
            result[1].name.should.equal 'b'

        it 'defaults to module type', ->

            result = OArg.parse (http) ->

            result[0].name.should.equal 'http'
            result[0].type.should.equal 'module'

        it 'defaults value to undefined', ->

            should.not.exist OArg.parse((http) -> )[0].value


        it 'still returns the array with function body', ->

            OArg.parse (x, y, z) ->

                'things in function'

            .length.should.equal 3


        xit 'allows comments mixed into function braces', ->

            # OArg.parse (
            #     oh, ### not with coffee script ###
            #     well
            # ) ->

        it 'allows comments mixed into function braces', ->

            `
            result = OArg.parse(function(
                p // comment
            ) {});
            
            `
            result[0].name.should.equal 'p'

