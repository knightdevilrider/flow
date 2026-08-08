
const fs = require('fs');

const gatePath = 'views/StaffGate.tsx';
if (fs.existsSync(gatePath)) {
  let code = fs.readFileSync(gatePath, 'utf8');
  
  // Replace strict grid-cols-2 with responsive one, except where it's already responsive
  // Wait, I can just replace grid-cols-2 with grid-cols-1 sm:grid-cols-2
  // But only if it's not preceded by sm: or md: or lg:
  // Using a regex with negative lookbehind (might not be supported if Node is old, but Node 22 supports it)
  code = code.replace(/(?<!sm:|md:|lg:)grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
  
  // Same for grid-cols-3
  code = code.replace(/(?<!sm:|md:|lg:)grid-cols-3/g, 'grid-cols-1 sm:grid-cols-3');
  
  fs.writeFileSync(gatePath, code, 'utf8');
  console.log('Fixed grids in StaffGate');
}

