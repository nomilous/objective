var logger = require('../logger');
var path = require('path');
var fs = require('fs');
var templatePath1, templatePath2;
var uuid = require('uuid');

module.exports.do = function(program, callback) {

  // ensure objective not already present

  [ 'objective.js',
    'objective.js.json',
    'objective.coffee',
    'objective.coffee.json'
  ].forEach(function(file) {
    try {
      fs.lstatSync(file);
      logger.error(-1, 'found existing objective file %s',file);
      process.exit(1);
    } catch(e) {}
  });
  
  var objectiveTemplate, jsonTemplate;
  var template  = program.template || 'default';
  var js        = program.js       || false;
  var json      = program.json     || false;
  var templates = getTemplates();
  var name      = (json ? 'json.' : '') + template;


  var template  = templates[name];
  if (typeof template == 'undefined') {
    logger.error('No such template.');
    console.log(templatePath1);
    console.log(templatePath2);
    process.exit(1);
  }

  if (js) {
    objectiveTemplate = template['.js'] ? template['.js'] : template['.coffee'];
  } else {
    objectiveTemplate = template['.coffee'];
    if (!objectiveTemplate) {
      logger.warn('no template for coffee %s', name);
      objectiveTemplate = template['.js'];
      js = true;
      if (!objectiveTemplate) {
        logger.error('failed fallback for js %s', name);
        process.exit(1);
      }
    }
  }

  if (template['.json']) {
    jsonTemplate = template['.json'];
  }

  try {
    var objectiveContent = fs.readFileSync(objectiveTemplate).toString();
    var jsonContent;
    var Uuid    = uuid.v4();
    var title   = 'Untitled'
    var output1, output2;

    // generate content

    objectiveContent = objectiveContent.replace(/__UUID__/g, Uuid);
    objectiveContent = objectiveContent.replace(/__TITLE__/g, title);

    if (js && objectiveTemplate.match(/\.coffee/)) {
      objectiveContent = require('coffee-script').compile(objectiveContent, {bare: true});
    }


    if (json) {
      if (jsonTemplate) {
        jsonContent = fs.readFileSync(jsonTemplate).toString();
        jsonContent = jsonContent.replace(/__UUID__/g, Uuid);
        jsonContent = jsonContent.replace(/__TITLE__/g, title);
      } else {
        jsonContent = JSON.stringify({
          uuid: Uuid,
          description: '',
          repl: {
            listen: '/tmp/socket-' + Uuid
          },
          plugins: []
        }, null, 2);
      }
    }

    // output files

    if (js) {
      output1 = 'objective.js';
      output2 = 'objective.js.json';
    } else {
      output1 = 'objective.coffee';
      output2 = 'objective.coffee.json';
    }


    fs.writeFileSync(output1, objectiveContent);
    logger.warn('created file %s',output1);

    if (json) {
      fs.writeFileSync(output2, jsonContent);
      logger.warn('created file %s',output2);
    }

  }
  catch (e) {
    logger.error(e);
    callback();
  }
}


function getTemplates() {
  templatePath1 = path.normalize(__dirname + '/../../../templates');
  var files = fs.readdirSync(templatePath1);
  var templates = {}

  // load builtin template list
  listTemplates(templates, files, templatePath1);

  // override builtin list from user
  templatePath2 = process.env[process.platform === 'win32' 
            ? 'USERPROFILE' 
            : 'HOME'] + path.sep + '.objective/templates';
  try {
    files = fs.readdirSync(templatePath2);
    listTemplates(templates, files, templatePath2);
  } catch (e) {}
  return templates;
}

function listTemplates(templates, files, templatePath) {
  files.forEach(function(template){
    var ext = path.extname(template);
    var base = path.basename(template, ext);
    var obj;

    if (typeof templates[base] === 'undefined')
      templates[base] = (
        obj = {},
        obj['' + ext] = templatePath + path.sep + base + ext,
        obj
      );
    else
      templates[base][ext] = templatePath + path.sep + base + ext;
  });
}

