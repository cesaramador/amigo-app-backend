import { readFileSync, writeFileSync } from 'fs';
const path = './middleware/security.middleware.js';
let content = readFileSync(path, 'utf8');
// Fix: regex was written as a string literal instead of RegExp literal
content = content.replace(
  `let out = String(str).replace('/[\\x00-\\x1F]/g', "").trim();`,
  `let out = String(str).replace(/[\\x00-\\x1F]/g, "").trim();`
);
writeFileSync(path, content, 'utf8');
console.log('Fixed security.middleware.js');