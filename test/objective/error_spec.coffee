describe 'Error', ->

    require '../../lib/objective/error'

    it 'overrides Error object', ->

        e = new Error()
        e.should.be.an.instanceof Error
        e.should.be.an.instanceof ExpandedError


    it 'has expanded stack frames starting at creation', ->

        e = new Error 'message'
        e.frames[0].fn.toString().should.match /THIS_FUNCTION/

