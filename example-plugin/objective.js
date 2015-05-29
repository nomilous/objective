objective({
  title: 'Untitled',
  uuid: '362d024b-69e5-4101-b41b-dcd81f09f38e',
  description: '',
  repl: {
    listen: '/tmp/socket-362d024b-69e5-4101-b41b-dcd81f09f38e'
  },
  plugins: {
    './example': {
      defaultMessage: '(als)o',
    }
  }
}).run(function(prompt, plugins) {

  plugins.example.start();

  prompt.start();

});
