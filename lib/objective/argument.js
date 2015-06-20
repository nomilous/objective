module.exports = ObjectiveArgument;

function ObjectiveArgument(name, type) {
  this.name = name;
  this.type = type;
  this.value = undefined;
}

ObjectiveArgument.parse = function(fn) {

  console.log(fn.toString());
  var type = 'module';
  var functionString = fn.toString();

  // var argString = fn.toString().match(/function\s*\((.*?)\)\s*{/)[1];

  return fn.toString()
    .replace(/\/\*.*?\*\//g,'')
    .replace(/\/\/.*/g,'')
    .replace(/\n/g,'')
    .replace(/\r/g,'')
    .replace(/\/\*.*?\*\//g,'')
    .match(/function\s*\((.*?)\)\s*{/)[1]
    .replace(/\s/g, '').split(',')
    .filter(function(arg) {
      if (arg !== '') return true;
    }).map(function(arg) {
      return new ObjectiveArgument(arg, type)
    });
}
