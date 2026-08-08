const fs = require('fs');
const file = 'constants/translations.ts';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace the waiting property in mr
  code = code.replace(/mr: \{([\s\S]*?)waiting: '[^']+',([\s\S]*?)\}/, 'mr: {$1waiting: \'वाट पाहणे\',$2}');
  
  // Replace the waiting property in hi
  code = code.replace(/hi: \{([\s\S]*?)waiting: '[^']+',([\s\S]*?)\}/, 'hi: {$1waiting: \'इंतज़ार\',$2}');

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed translations');
} else {
  console.log('File not found');
}
