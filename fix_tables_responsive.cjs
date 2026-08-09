const fs = require('fs');
const glob = require('glob'); // Not available by default in Node. I'll just use readdirSync.

const files = fs.readdirSync('views').filter(f => f.startsWith('Staff') && f.endsWith('.tsx'));

for (const file of files) {
  const filePath = 'views/' + file;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Upgrade table wrappers
  content = content.replace(/<div className="overflow-x-auto">/g, '<div className="w-full overflow-x-auto border-inherit rounded-xl">');
  
  // Fix massive paddings that compress tables on mobile
  content = content.replace(/p-8/g, 'p-4 sm:p-8');
  content = content.replace(/p-6/g, 'p-3 sm:p-6');
  
  fs.writeFileSync(filePath, content);
}
