
const fs = require('fs');
const file = 'views/PublicDisplayView.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace truncate leading-normal pt-1 with a larger line height and padding
  // We'll use pt-3 to give the top matras plenty of room, and pb-1 to balance it
  // and we'll use leading-relaxed to give the line box more inherent height
  code = code.replace(/truncate leading-normal pt-1/g, 'truncate leading-relaxed pt-3 pb-2');

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed matras clipping');
} else {
  console.log('File not found');
}

