fs = require 'fs'

module.exports = 

    load: ->

        try
            
            {username, email, key} = JSON.parse(
                fs.readFileSync process.env.HOME + '/.objective/user.json'
            )
            module.exports.username = username
            module.exports.email = email
            module.exports.key = key

        catch e
            
            if e.errno == 34

                console.log 'No user. Use --register'
                process.exit 1

            console.log e.toString()
