const fs = require('fs');

const file = 'views/PublicDisplayView.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // 1. Change CAROUSEL_SIZE from 6 to 5
  code = code.replace(/const CAROUSEL_SIZE = 6;/g, 'const CAROUSEL_SIZE = 5;');
  
  // 2. Remove the User icon block
  const userIconRegex = /<div className="w-10 h-10 rounded-full bg-\[\#007AFF\]\/20 flex items-center justify-center shrink">\s*<User className="w-5 h-5 text-\[\#0A84FF\]" \/>\s*<\/div>/g;
  code = code.replace(userIconRegex, '');
  
  // 3. Make right panel gap slightly smaller on smaller screens if needed (gap-4 to gap-3 or gap-2)
  // Let's change the small card min-height from min-h-[90px] to min-h-[85px] just in case
  code = code.replace(/min-h-\[90px\]/g, 'min-h-[85px]');
  
  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed PublicDisplayView');
}
