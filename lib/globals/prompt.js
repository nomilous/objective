// Generated by CoffeeScript 1.9.2
var appendToCommand, autoComplete, autoCompleteAssemble, autoCompleteStartsWith, backspace, bell, command, commands, createEvent, cursorScroll, emit, endSearch, fs, history, historyCursor, historyFile, historyScroll, historySearch, keypress, lastPart, latestCommand, normalize, offset, postPrompt, prePrompt, promptWidth, ref, ref1, runCommand, running, searchLine, searching, sep, setPrompt, showHelp, updateSearch, writeAutoCompletePosibilities, writePrompt;

ref = require('./pipeline'), createEvent = ref.createEvent, emit = ref.emit;

createEvent('prompt.commands.register.ask');

keypress = require('keypress');

fs = require('fs');

ref1 = require('path'), normalize = ref1.normalize, sep = ref1.sep;

command = '';

prePrompt = '> ';

postPrompt = '';

promptWidth = prePrompt.length;

offset = 0;

searching = false;

running = false;

bell = function() {
  return process.stdout.write('\u0007');
};

commands = {
  'help': {
    run: function(args, callback) {
      return showHelp(args, callback);
    },
    help: "\n\"hope this helps\"\n",
    autoComplete: function(args, callback) {
      var cmd;
      return callback(null, (function() {
        var results;
        results = [];
        for (cmd in commands) {
          results.push(cmd);
        }
        return results;
      })());
    }
  }
};

showHelp = function(args, callback) {
  var cmd;
  if (args.length > 0) {
    cmd = args[0];
    if (commands[cmd] == null) {
      console.log("\n" + cmd + " does not exist\n");
      return callback();
    }
    console.log(commands[cmd].help || ("\nno help for " + cmd + "\n"));
    return callback();
  }
  console.log();
  console.log("help [command]           Per command help.");
  console.log();
  for (cmd in commands) {
    process.stdout.write(cmd);
    process.stdout.cursorTo(25);
    console.log(commands[cmd].description || 'No description.');
  }
  return callback();
};

setPrompt = function(newPrompt) {
  prePrompt = newPrompt;
  return promptWidth = prePrompt.length;
};

writePrompt = function(newline) {
  if (newline) {
    process.stdout.write("\n" + prePrompt + command + postPrompt);
  } else {
    process.stdout.write(prePrompt + command + postPrompt);
  }
  return process.stdout.cursorTo(promptWidth + command.length);
};

appendToCommand = function(char) {
  var ch, chars, j, len;
  chars = [];
  for (j = 0, len = command.length; j < len; j++) {
    ch = command[j];
    chars.push(ch);
  }
  chars.splice(command.length - offset, 0, char);
  command = chars.join('');
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  writePrompt();
  process.stdout.cursorTo(command.length - offset + promptWidth);
  if (searching) {
    return updateSearch();
  }
};

runCommand = function() {
  var args, callback, cmd, err;
  command = command.trim();
  if (command.length === 0) {
    return writePrompt(true);
  }
  running = true;
  args = command.split(' ');
  cmd = args[0];
  args = args.slice(1);
  if (commands[cmd] != null) {
    if (history[0] !== command) {
      history.unshift(command);
    }
    while (history.length > 2000) {
      history.pop();
    }
    console.log();
    command = '';
    try {
      callback = function(err, res) {
        running = false;
        if (err != null) {
          console.log();
          console.log("" + (err.toString()));
        } else {
          console.log();
          if (res != null) {
            console.log(res);
          }
        }
        return writePrompt(true);
      };
      callback.write = function(text) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        return process.stdout.write(text.toString());
      };
      callback.writeLine = function(text) {
        return console.log(text);
      };
      commands[cmd].run(args, callback);
      return;
    } catch (_error) {
      err = _error;
      running = false;
      console.log("" + (err.toString()));
    }
  } else {
    console.log("\n" + cmd + ": command not found");
    command = '';
    running = false;
  }
  return writePrompt(true);
};

lastPart = void 0;

autoCompleteStartsWith = function(args, array) {
  var accum, col, j, k, l, len, len1, letter, newArray, part, ref2, shortest, word;
  if (array.length === 0) {
    array = null;
  }
  part = (function() {
    try {
      return args[args.length - 1];
    } catch (_error) {}
  })();
  part || (part = '');
  accum = '';
  if (part.length > 0) {
    newArray = [];
    array.map(function(word) {
      if (word.indexOf(part) === 0) {
        return newArray.push(word);
      }
    });
    if (newArray.length === 1) {
      return [newArray[0], true, newArray];
    }
    if (newArray.length !== 0) {
      array = newArray;
    } else {
      bell();
      return [null, false, []];
    }
  }
  shortest = 1000;
  for (j = 0, len = array.length; j < len; j++) {
    word = array[j];
    if (!(shortest < word.length)) {
      shortest = word.length;
    }
  }
  for (col = k = 0, ref2 = shortest; 0 <= ref2 ? k <= ref2 : k >= ref2; col = 0 <= ref2 ? ++k : --k) {
    letter = void 0;
    for (l = 0, len1 = array.length; l < len1; l++) {
      word = array[l];
      if (!word[col]) {
        continue;
      }
      letter || (letter = word[col]);
      if (letter !== word[col]) {
        return [accum, false, array];
      }
    }
    if (letter != null) {
      accum += letter;
    }
  }
  return [accum, false, array];
};

writeAutoCompletePosibilities = function(array, type) {
  var last, nextPaths, parts, path;
  if (type === 'path') {
    nextPaths = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = array.length; j < len; j++) {
        path = array[j];
        parts = path.split(sep);
        last = parts.length - 1;
        if (parts[last] === '') {
          results.push(path = parts[last - 1] + sep);
        } else {
          results.push(path = parts[last]);
        }
      }
      return results;
    })();
    console.log("\n\n" + (nextPaths.join('\n')));
    return;
  }
  return console.log("\n\n" + (array.join('\n')));
};

autoCompleteAssemble = function(possibles, args, completion, arg) {
  var fullMatch, matches, part, type;
  part = arg[0], fullMatch = arg[1], matches = arg[2];
  if (part == null) {
    return;
  }
  type = void 0;
  try {
    type = completion.type;
  } catch (_error) {}
  if (fullMatch) {
    command = command.substr(0, command.length - args[args.length - 1].length);
    command += part + ' ';
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    writePrompt();
    lastPart = void 0;
    return;
  }
  if (part.length === 0) {
    writeAutoCompletePosibilities(possibles, type);
    writePrompt(true);
    lastPart = void 0;
    return;
  }
  if (part === lastPart) {
    writeAutoCompletePosibilities(matches, type);
    console.log();
  }
  lastPart = part;
  command = command.substr(0, command.length - args[args.length - 1].length);
  command += part;
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  return writePrompt();
};

autoComplete = function() {
  var args, cmd, err, j, len, line, possibilities, ref2;
  offset = 0;
  if (command.trim().length === 0) {
    showHelp([], function() {});
    writePrompt(true);
    return;
  }
  args = command.split(' ');
  cmd = args[0];
  args = args.slice(1);
  if ((commands[cmd] != null) && args.length > 0) {
    try {
      commands[cmd].autoComplete(args, function(err, possibles) {
        var contents, e, f, file, j, len, parts, path, possibilities, stat, type;
        if (err != null) {
          console.log();
          console.log("Error in autoComplete " + (err.toString()));
          command = '';
          writePrompt(true);
          return;
        }
        if (!possibles) {
          bell();
          return;
        }
        if (possibles.constructor.name === 'Array') {
          return autoCompleteAssemble(possibles, args, null, autoCompleteStartsWith(args, possibles));
        }
        if (possibles.type !== 'path') {
          return;
        }
        path = args[args.length - 1];
        parts = path.split(sep);
        file = parts.pop();
        path = parts.join(sep) + sep;
        if (path === sep) {
          if (args[args.length - 1][0] !== '/') {
            if (args[args.length - 1] !== sep) {
              path = '';
            }
          }
        }
        try {
          stat = fs.lstatSync(path);
          if (stat.isDirectory()) {
            path = normalize(path + sep);
          }
        } catch (_error) {
          path = '.' + sep;
        }
        possibilities = [];
        contents = fs.readdirSync(path);
        for (j = 0, len = contents.length; j < len; j++) {
          f = contents[j];
          f = normalize(path + sep + f);
          try {
            stat = fs.lstatSync(f);
            if (stat.isDirectory()) {
              f += sep;
            }
            if (possibles.onlyDirectories) {
              if (stat.isDirectory()) {
                possibilities.push(f);
              }
              continue;
            }
            possibilities.push(f);
          } catch (_error) {
            e = _error;
            console.log();
            console.log("Error in autoComplete " + (e.toString()));
            writePrompt(true);
          }
        }
        if (possibilities.length === 0) {
          bell();
          return;
        }
        autoCompleteAssemble(possibilities, args, possibles, autoCompleteStartsWith(args, possibilities));
        type = possibles.type || '';
        if (type === 'path') {
          if (args[args.length - 1].length !== 0) {
            if (command.match(/\/\s$/)) {
              command = command.substr(0, command.length - 1);
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              return writePrompt();
            }
          }
        }
      });
    } catch (_error) {
      err = _error;
      console.log();
      console.log("Error in autoComplete " + (err.toString()));
      console.log(err.stack);
      command = '';
      writePrompt(true);
    }
    return;
  }
  possibilities = (function() {
    var results;
    results = [];
    for (cmd in commands) {
      results.push(cmd);
    }
    return results;
  })();
  autoCompleteAssemble(possibilities, [command], null, autoCompleteStartsWith([command], possibilities));
  if (command.match(/\s$/)) {
    cmd = command.substr(0, command.length - 1);
    ref2 = commands[cmd].help.split('\n');
    for (j = 0, len = ref2.length; j < len; j++) {
      line = ref2[j];
      if (line.match(/Usage\:/)) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(line);
        console.log();
      }
    }
    return commands[cmd].autoComplete([''], function(err, res) {
      if (res.type === 'path' && (res.startIn != null)) {
        command = cmd + ' ' + res.startIn;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        return writePrompt();
      }
    });
  }
};

historyFile = process.env.HOME + '/.objective/command_history';

historyCursor = 0;

latestCommand = '';

history = (function() {
  try {
    return fs.readFileSync(historyFile).toString().trim().split('\n');
  } catch (_error) {}
})();

history || (history = []);

process.on('exit', function() {
  try {
    return fs.writeFileSync(historyFile, history.join('\n'));
  } catch (_error) {}
});

historyScroll = function(direction) {
  switch (direction) {
    case 'up':
      if (historyCursor === 0) {
        latestCommand = command;
      }
      if (!(historyCursor >= history.length)) {
        historyCursor++;
      }
      break;
    case 'down':
      if (historyCursor !== 0) {
        historyCursor--;
      }
  }
  command = history[historyCursor - 1] || latestCommand;
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  return writePrompt();
};

historySearch = function() {
  if (searching) {
    return updateSearch(searchLine);
  }
  searching = true;
  command = '';
  setPrompt('(search)\'');
  postPrompt = '\':';
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  return writePrompt();
};

searchLine = 0;

updateSearch = function(start) {
  var found, i, j, line, position, ref2, ref3;
  if (start == null) {
    start = 0;
  }
  searchLine = start;
  if (command.length === 0) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    postPrompt = '\':';
    writePrompt(false);
    return;
  }
  found = false;
  for (i = j = ref2 = start, ref3 = history.length; ref2 <= ref3 ? j <= ref3 : j >= ref3; i = ref2 <= ref3 ? ++j : --j) {
    line = history[i] || '';
    position = line.indexOf(command);
    if (position === -1) {
      searchLine++;
      continue;
    }
    postPrompt = "': " + line;
    searchLine++;
    found = true;
    break;
  }
  if (!found) {
    command = command.substr(0, command.length - 1);
    postPrompt = '\':';
    bell();
  }
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  return writePrompt(false);
};

endSearch = function() {
  command = history[searchLine - 1] || '';
  if (postPrompt.length < 3) {
    command = '';
  }
  postPrompt = '';
  setPrompt('> ');
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  writePrompt(false);
  return searching = false;
};

cursorScroll = function(direction) {
  var position;
  position = command.length - offset;
  switch (direction) {
    case 'left':
      if (position !== 0) {
        offset++;
        position--;
      }
      break;
    case 'right':
      if (!(position >= command.length)) {
        offset--;
        position++;
      }
  }
  return process.stdout.cursorTo(position + promptWidth);
};

backspace = function() {
  var char, chars, j, len, position;
  if (command.length === 0) {
    return;
  }
  position = command.length - offset - 1;
  if (position < 0) {
    return;
  }
  chars = [];
  for (j = 0, len = command.length; j < len; j++) {
    char = command[j];
    chars.push(char);
  }
  chars.splice(position, 1);
  command = chars.join('');
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  writePrompt();
  process.stdout.cursorTo(position + promptWidth);
  if (searching) {
    return updateSearch();
  }
};

module.exports = function(done) {
  var registrar;
  registrar = {};
  Object.defineProperty(registrar, 'create', {
    get: function() {
      return function(name, config) {
        if (commands[name] != null) {
          if (config.altname == null) {
            throw new Error("Command name collision on '" + name + "'");
          }
          name = config.altname;
        }
        return commands[name] = config;
      };
    }
  });
  return emit('prompt.commands.register.ask', registrar, function(err, res) {
    if (err != null) {
      return done(err);
    }
    keypress(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', function(ch, key) {
      if (running) {
        return;
      }
      try {
        if (key.name === 'return') {
          historyCursor = 0;
          if (searching) {
            endSearch();
          }
          if (command.length > 0) {
            return runCommand();
          }
          return writePrompt(true);
        }
      } catch (_error) {}
      if (key == null) {
        return appendToCommand(ch);
      }
      if ((ch != null) && ch.match(/^[a-zA-Z0-9_]*$/)) {
        return appendToCommand(ch);
      }
      try {
        if (key.ctrl && (key.name === 'c' || key.name === 'd')) {
          historyCursor = 0;
          if (searching) {
            endSearch();
            command = '';
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            writePrompt(false);
            return;
          }
          try {
            if (command.length > 0) {
              command = '';
              return writePrompt(true);
            }
          } catch (_error) {}
          try {
            done();
          } catch (_error) {}
          return process.exit(1);
        }
      } catch (_error) {}
      if ((ch != null) && ch === ' ') {
        return appendToCommand(ch);
      }
      try {
        if (key.name === 'tab') {
          if (searching) {
            return endSearch();
          }
          return autoComplete();
        }
      } catch (_error) {}
      try {
        if (key.name === 'backspace') {
          return backspace();
        }
      } catch (_error) {}
      try {
        if (key.ctrl && key.name === 'r') {
          return historySearch();
        }
      } catch (_error) {}
      try {
        if (key.name === 'up' || key.name === 'down') {
          if (searching) {
            return;
          }
          return historyScroll(key.name);
        }
      } catch (_error) {}
      try {
        if (key.name === 'left' || key.name === 'right') {
          return cursorScroll(key.name);
        }
      } catch (_error) {}
    });
    console.log();
    console.log();
    console.log("    help . . provides");
    console.log("    tab  . . auto-completes command ((Twice)");
    console.log("    ^c . . . quits or clears line");
    console.log("    ^r . . . reverse searches command history");
    console.log("             (tab chooses, return runs)");
    console.log();
    console.log();
    return writePrompt();
  });
};