const fs = require('fs');

// Fix translations
const transPath = 'constants/translations.ts';
let transData = fs.readFileSync(transPath, 'utf8');

transData = transData.replace(/waiting:\s*'.*?',/g, (match, offset, string) => {
  const before = string.substring(Math.max(0, offset - 500), offset);
  if (before.includes('mr: {')) {
    return "waiting: 'वाट पाहणे / प्रतीक्षा',";
  }
  if (before.includes('hi: {')) {
    return "waiting: 'इंतज़ार / प्रतीक्षा',";
  }
  if (before.includes('en: {')) {
    return "waiting: 'WAITING',";
  }
  return match;
});
fs.writeFileSync(transPath, transData, 'utf8');

// Fix padding in PublicDisplayView
const pubPath = 'views/PublicDisplayView.tsx';
let pubData = fs.readFileSync(pubPath, 'utf8');

pubData = pubData.replace('px-16 py-6 mb-2 relative', 'px-16 pt-6 pb-2 relative');
pubData = pubData.replace(/p-8 gap-8/g, 'px-8 pb-8 pt-2 gap-8');
pubData = pubData.replace(/p-4 gap-4/g, 'px-4 pb-4 pt-0 gap-4');

fs.writeFileSync(pubPath, pubData, 'utf8');
console.log('Fixes applied successfully!');
