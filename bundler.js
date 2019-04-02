'use strict';


const Terser = require('terser');
const fs = require('fs');

try {
  let { error, code } = Terser.minify(fs.readFileSync('./index.js', 'utf-8'));
  if (error) {
    throw error;
  }
  fs.writeFileSync('./index_min.js', code, 'utf-8');
} catch (err) {
  console.error(err);
}

