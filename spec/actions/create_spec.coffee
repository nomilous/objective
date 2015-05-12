{ipso} = require 'ipso'
{deferred} = require 'also'

describe 'create', ->

    it 'creates a new objective', 

        ipso (done, Create, Uplink) ->

            Create.does

                generate_objective: deferred ({resolve}) -> resolve()

            Create.do {}, ->

                done()