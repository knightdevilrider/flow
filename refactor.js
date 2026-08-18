const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  if (file === 'MainDashboard.tsx' || file === 'PublicDisplayView.tsx') continue;
  
  let content = fs.readFileSync(path.join(viewsDir, file), 'utf8');

  if (!content.includes('themeStyles = {')) continue;

  // 1. Add import
  if (!content.includes('getPremiumStyles')) {
    const importMatch = content.match(/import.*?;/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(lastImport, lastImport + '\nimport { getPremiumStyles } from \'../theme/premiumDesign\';');
    }
  }

  // 2. Remove themeStyles object
  // Find start index of themeStyles
  const startIndex = content.indexOf('const themeStyles = {');
  if (startIndex !== -1) {
    let braceCount = 0;
    let endIndex = startIndex;
    let started = false;
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        started = true;
      } else if (content[i] === '}') {
        braceCount--;
      }
      if (started && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
    
    // Also remove any trailing semicolon and whitespace
    let endStr = content.substring(startIndex, endIndex);
    let afterStr = content.substring(endIndex);
    const semicolonMatch = afterStr.match(/^;\s*/);
    if (semicolonMatch) {
      endIndex += semicolonMatch[0].length;
    }
    
    content = content.substring(0, startIndex) + content.substring(endIndex);
  }

  // 3. Replace assignment
  content = content.replace(/const s = themeStyles\[theme\];/g, 'const s = getPremiumStyles(theme);');

  // 4. Remove max-sm classes
  const regexPatterns = [
    /max-sm:bg-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:text-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:border-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:shadow-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:rounded-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:p-[0-9]+/g,
    /max-sm:dark:bg-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:dark:text-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:dark:border-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:py-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:px-[a-zA-Z0-9\-\/\[\]#]+/g,
    /max-sm:overflow-x-auto/g,
    /max-sm:w-full/g,
  ];

  for (const regex of regexPatterns) {
    content = content.replace(regex, '');
  }

  // cleanup multiple spaces
  content = content.replace(/  +/g, ' ');
  content = content.replace(/ \}/g, '}');
  content = content.replace(/ \{/g, '{');
  content = content.replace(/ \`/g, '`');

  fs.writeFileSync(path.join(viewsDir, file), content, 'utf8');
  console.log(`Processed ${file}`);
}
