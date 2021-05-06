/*
    All code within this @file belongs to Stephen Miller, Demicube Corp @copyright 2021
    unless otherwise written, sourced, cited, linked, or implied.
    Do not redistribute without prior consent.
*/

const fs = require('fs');
const decode = require('./decode.js');
const encode = require('./encode.js');

const Commands = {
  decode: {
    params: [
      'FILE_PATH_OR_STRING_TO_DECODE: String to be decoded or relative path to file',
      'PASSWORD: Password used to decode string',
      'OUTPUT_FILE: (optional) file to output resulting string to',
    ],
    example: 'decode <FILE_PATH_OR_STRING_TO_DECODE> <PASSWORD> <OUTPUT_FILE>',
    exec: (string, pass, outputFile) => {
      const result = decode(string, pass);
      if (outputFile) {
        // Out put to file
        const fileName = `${__dirname}/${outputFile}`;
        fs.writeFile(fileName, result, { flag: 'w' }, (err) => {
          if (err) {
            console.log('err:', err);
          }
        });
        return `Written to file: ${fileName}`;
      }
      return result;
    },
  },
  encode: {
    params: [
      'FILE_PATH_OR_STRING_TO_ENCODE: String to be encoded or relative path to file',
      'PASSWORD: Password used to encode string',
      'OUTPUT_FILE: (optional) file to output resulting string to',
    ],
    example: 'encode <FILE_PATH_OR_STRING_TO_ENCODE> <PASSWORD> <OUTPUT_FILE>',
    exec: (string, pass, outputFile) => {
      const result = encode(string, pass);
      if (outputFile) {
        // Out put to file
        const fileName = `${__dirname}/${outputFile}`;
        fs.writeFile(fileName, result, { flag: 'w' }, (err) => {
          if (err) {
            console.log('err:', err);
          }
        });
        return `Written to file: ${fileName}`;
      }
      return result;
    },
  },
};

const [command, string, pass, outputFile] = process.argv.slice(2);

const commandObjToExec = Commands[command];

// If valid command is entered
if (commandObjToExec) {
  // If file is detected
  if (string.includes('./')) {
    fs.readFile(string, (err, data) => {
      if (err) {
        console.log('err:', err);
      }
      // Assuming file found
      const fileString = data.toString();
      console.log(commandObjToExec.exec(fileString, pass, outputFile));
    });
  } else if (string && pass) {
    try {
      console.log(commandObjToExec.exec(string, pass, outputFile));
    } catch (error) {
      console.log('error:', error);
    }
  } else {
    console.log(`${command} requires a valid string to passed in for both your string & password arguments`);
  }
} else {
  // Documentation if no valid command is entered
  console.log('Uh oh that didn\'t quite work...\n');
  console.log('Try entering one of the following commands:\n');
  Object.keys(Commands).forEach((key) => {
    const obj = Commands[key];
    console.log(`${obj.example}`);
    console.log(`parameters: ${JSON.stringify(obj.params, null, 2)}`);
    console.log('\n=========================\n');
  });
}
