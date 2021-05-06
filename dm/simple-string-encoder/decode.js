/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-const */

/*
    All code within this @file belongs to Stephen Miller, Demicube Corp @copyright 2021
    unless otherwise written, sourced, cited, linked, or implied.
    Do not redistribute without prior consent.
*/

const atob = require('atob');
const btoa = require('btoa');

function Decode(stringToDecode, filePassword) {
  let decodedString;
  /* passwordVariables */
  const len = filePassword.length;
  let tempCode = 0;
  let keyCode = 0;
  /* decodeVariables */
  let arrayToStr;
  const arr = [0];
  let leng;
  let str = '';
  /* decompressVariables */
  const dict = {};
  const s = stringToDecode;
  const data = (`${s}`).split('');
  let currChar = data[0];
  let oldPhrase = currChar;
  const out = [currChar];
  let code = 256;
  let phrase;
  // set password
  for (let i = 0; i < len; i += 1) {
    tempCode += btoa(filePassword).charCodeAt(i);
  }
  keyCode = tempCode;
  // decompress compressed string
  for (let i = 1; i < data.length; i += 1) {
    const currCode = data[i].charCodeAt(0);
    if (currCode < 256) {
      phrase = data[i];
    } else {
      phrase = dict[currCode] ? dict[currCode] : oldPhrase + currChar;
    }
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict[code] = oldPhrase + currChar;
    code += 1;
    oldPhrase = phrase;
  }
  // decode an array of encoded data from encode() make sure parameter is an array  with brackets.
  decodedString = out.join('');
  decodedString = decodedString.split(',');
  let index = 0;
  const indexL = decodedString.length;
  const placeHolder = [0];
  while (index < indexL) {
    placeHolder[index] = Number(decodedString[index]);
    index += 1;
  }
  decodedString = placeHolder;
  arrayToStr = decodedString;
  leng = arrayToStr.length;
  for (let i = 0; i < leng; i += 1) {
    arr[i] = arrayToStr[i] / keyCode;
    str += String.fromCharCode(arr[i]);
  }
  decodedString = atob(str);

  return decodedString;
}

module.exports = Decode;
