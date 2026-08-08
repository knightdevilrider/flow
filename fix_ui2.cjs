
const fs = require('fs');
const pubPath = 'views/PublicDisplayView.tsx';
let pubData = fs.readFileSync(pubPath, 'utf8');

// 1. Increase patient name font size on the right side small cards
// <h3 className={\	ext-lg font-black uppercase truncate \\}>{currentLang === 'en' ? p.name : transliterateToDevanagari(p.name)}</h3>
pubData = pubData.replace(
  /text-lg font-black uppercase truncate/g,
  'text-2xl lg:text-3xl font-black uppercase truncate leading-normal pt-1'
);

// 2. Increase bottom padding on the main panels so they don't hit the marquee
// Currently it has px-4 pb-4 pt-0 gap-4 and px-8 pb-8 pt-2 gap-8
pubData = pubData.replace(/pb-4 pt-0/g, 'pb-12 pt-0');
pubData = pubData.replace(/pb-8 pt-2/g, 'pb-16 pt-2');

// Also, the left blue cards might need to shrink if the screen is short
pubData = pubData.replace(/shrink-0/g, 'shrink');

fs.writeFileSync(pubPath, pubData, 'utf8');
console.log('UI Fixes 2 applied!');

