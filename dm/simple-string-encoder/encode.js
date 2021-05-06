/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-const */

/*
    All code within this @file belongs to Stephen Miller, Demicube Corp @copyright 2021
    unless otherwise written, sourced, cited, linked, or implied.
    Do not redistribute without prior consent.
*/

const btoa = require('btoa');

function Encode(stringToEncode, filePassword) {
  let encodedString;
  /* passwordVariables */
  const len = filePassword.length;
  let tempCode = 0;
  let keyCode = 0;
  /* encodeVariables */
  const tempstringToEncode = btoa(stringToEncode);
  const leng = tempstringToEncode.length;
  const finalStr = [0];
  const firstChar = tempstringToEncode.charCodeAt(0);
  /* compressVariables */
  const dict = {};
  let data;
  const out = [];
  let currChar;
  let phrase;
  let code = 256;
  let s;
  // set password
  for (let i = 0; i < len; i += 1) {
    tempCode += btoa(filePassword).charCodeAt(i);
  }
  keyCode = tempCode;
  // encode to finalStr
  for (let i = 0; i < leng; i += 1) {
    finalStr[i] = tempstringToEncode.charCodeAt(i) * keyCode;
  }
  // compress
  s = finalStr;
  data = `${s}`.split('');
  phrase = data[0];
  for (let i = 1; i < data.length; i += 1) {
    currChar = data[i];
    if (dict[phrase + currChar] != null) {
      phrase += currChar;
    } else {
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      dict[phrase + currChar] = code;
      code += 1;
      phrase = currChar;
    }
  }
  out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = String.fromCharCode(out[i]);
  }
  encodedString = out.join('');

  return encodedString;
}

module.exports = Encode;
