
const fs = require('fs');
const file = 'views/PublicDisplayView.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Increase name size on small cards
  code = code.replace(
    /text-2xl lg:text-3xl/g,
    'text-4xl lg:text-5xl'
  );
  
  // Also, since the text is now huge, the min-height of the small cards might need a bump to prevent overlap within the card
  code = code.replace(
    /min-h-\[85px\]/g,
    'min-h-[100px]'
  );
  code = code.replace(
    /min-h-\[90px\]/g,
    'min-h-[100px]'
  );

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed font size in PublicDisplayView');
}

