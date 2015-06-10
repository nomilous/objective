describe 'Objective', ->

    before -> require '../' # package.json

    context 'ObjectiveError', ->

        it 'has expanded stack frames starting where the error was created', ->

            e = new ObjectiveError

            ### THIS FUNCTION ###

            e.frames[0].fn.toString().should.match /THIS_FUNCTION/
            