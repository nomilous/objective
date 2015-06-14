describe 'ObjectiveError', ->

    require '../../lib/objective/error'

    it.only 'overrides Error object', ->

        e = new ObjectiveError('message')
        e.should.be.an.instanceof Error
        e.should.be.an.instanceof ObjectiveError
        console.log e



    it 'has expanded stack frames starting at creation', ->

        e = new ObjectiveError 'message'
        e.frames[0].fn.toString().should.match /THIS_FUNCTION/

