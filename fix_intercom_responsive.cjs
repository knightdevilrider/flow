const fs = require('fs');
let content = fs.readFileSync('components/admin/GlobalIntercomWidget.tsx', 'utf8');

// Fix intercom widget container width
content = content.replace(/w-80/g, 'w-[95vw] sm:w-80');
content = content.replace(/w-96/g, 'w-[95vw] sm:w-96');

// Adjust positioning to not clip on mobile
content = content.replace(/bottom-6 right-6/g, 'bottom-2 right-2 sm:bottom-6 sm:right-6');
content = content.replace(/bottom-4 right-4/g, 'bottom-2 right-2 sm:bottom-4 sm:right-4');

// Modal inner chat height max
content = content.replace(/h-\[400px\]/g, 'h-[60vh] sm:h-[400px]');
content = content.replace(/max-h-\[400px\]/g, 'max-h-[60vh] sm:max-h-[400px]');

fs.writeFileSync('components/admin/GlobalIntercomWidget.tsx', content);
