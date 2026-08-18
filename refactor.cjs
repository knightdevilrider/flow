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
    
    let afterStr = content.substring(endIndex);
    const semicolonMatch = afterStr.match(/^;\s*/);
    if (semicolonMatch) {
      endIndex += semicolonMatch[0].length;
    }
    
    content = content.substring(0, startIndex) + content.substring(endIndex);
  }

  // 3. Replace assignment
  content = content.replace(/const s = themeStyles\[theme\];/g, 'const s = getPremiumStyles(theme);');

  // 4. Remove max-sm classes (doing this carefully)
  const removeMaxSm = (str) => {
    return str.replace(/max-sm:[^\s'"\]}]+/g, '');
  };
  
  // We only want to remove max-sm: classes that are related to colors/backgrounds to strip the pastel look.
  // Actually, the user wants it to look professional everywhere. So all max-sm:bg-*, max-sm:text-*, max-sm:rounded-*, max-sm:border-*, max-sm:shadow-* should go.
  // We'll replace them globally.
  content = content.replace(/max-sm:bg-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:text-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:border-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:shadow-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:rounded-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:p-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:dark:bg-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:dark:text-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:dark:border-[^\s'"\]}]+/g, '');
  content = content.replace(/max-sm:dark:[^\s'"\]}]+/g, '');

  // cleanup multiple spaces inside quotes
  content = content.replace(/  +/g, ' ');
  content = content.replace(/ \}/g, '}');
  content = content.replace(/ \{/g, '{');
  content = content.replace(/ \`/g, '`');

  fs.writeFileSync(path.join(viewsDir, file), content, 'utf8');
  console.log(`Processed ${file}`);
}
