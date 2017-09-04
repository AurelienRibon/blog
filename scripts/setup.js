'use strict';

const fs   = require('fs');
const path = require('path');

injectRandomNumber(`${__dirname}/../public/index.html`);

function injectRandomNumber(filePath) {
  const random  = 1000000 + Math.floor(Math.random() * 1000000);
  const absPath = path.resolve(filePath);

  console.log(`Injecting random ${random} into ${absPath}`);

  const content    = fs.readFileSync(absPath, 'utf8');
  const newContent = content.replace(/RANDOMNUMBER/g, random);
  fs.writeFileSync(absPath, newContent, 'utf8');
}
