const fs = require('fs');
let content = fs.readFileSync('components/Layout.tsx', 'utf8');

// Fix Left Side
content = content.replace('w-[280px]', 'flex-1 sm:w-[280px] sm:flex-none');

// Fix Right Side
content = content.replace('className="flex items-center justify-end gap-4 w-[280px]"', 'className="flex items-center justify-end gap-1 sm:gap-4 flex-1 sm:w-[280px] sm:flex-none"');
content = content.replace('className="flex items-center justify-end gap-3 w-[280px]"', 'className="flex items-center justify-end gap-1 sm:gap-3 flex-1 sm:w-[280px] sm:flex-none"');

// Fix text sizes
content = content.replaceAll('text-[11px] font-bold', 'text-[9px] sm:text-[11px] font-bold');
content = content.replaceAll('px-4 py-2', 'px-2 py-1.5 sm:px-4 sm:py-2');
content = content.replaceAll('px-3 py-1.5', 'px-2 py-1 sm:px-3 sm:py-1.5');

// Fix titles
content = content.replace('text-xl sm:text-2xl', 'text-sm sm:text-xl md:text-2xl');

// Add responsive container to children area to prevent wide content from pushing screen
content = content.replace('<main className="flex-1 relative">', '<main className="flex-1 relative w-full overflow-x-hidden">');

fs.writeFileSync('components/Layout.tsx', content);
