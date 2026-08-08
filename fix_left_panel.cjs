
const fs = require('fs');
const file = 'views/PublicDisplayView.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Card 1
  code = code.replace(/min-h-\[220px\]/g, 'min-h-[180px]');
  code = code.replace(/p-8 min-h-\[180px\]/g, 'p-6 min-h-[180px]');
  
  // Card 2
  code = code.replace(/min-h-\[140px\]/g, 'min-h-[120px]');
  code = code.replace(/p-6 min-h-\[120px\]/g, 'p-4 min-h-[120px]');
  
  // Card 3
  code = code.replace(/min-h-\[100px\]/g, 'min-h-[90px]');
  
  // Decrease padding/gap in left panel wrapper
  code = code.replace(/bg-black\/20 rounded-\[2rem\] border border-white\/5 p-4/g, 'bg-black/20 rounded-[2rem] border border-white/5 p-2');
  code = code.replace(/flex-1 flex flex-col justify-center gap-4/g, 'flex-1 flex flex-col justify-center gap-2');

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed left panel layout in flow');
} else {
  console.log('File not found');
}

