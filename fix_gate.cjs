
const fs = require('fs');
const file = 'views/StaffGate.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Remove the block
  const regex = /<h3 className=\{\	ext-xs font-black uppercase tracking-widest opacity-60 \$\{s.sub\}\\}>Public Display Preferences<\/h3>[\s\S]*?<\/label>/;
  code = code.replace(regex, '');

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed StaffGate checkbox');
}

