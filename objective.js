require('./lib/objective')({

    uuid: '226d2f12-6242-44f4-8cc8-6aad790632b2',
    title: '',
    description: '',
    private: true,
    plugins: ['objective-dev']

}).run(function(e){

    if (e) return console.log(e);

    dev.testDir = 'spec'
    dev.sourceDir = 'lib'

    objective.recurse(['spec'], {create: true}, function() {

        objective.prompt();

    });

});