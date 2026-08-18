const fs = require('fs');

let content = fs.readFileSync('components/admin/PatientFormModal.tsx', 'utf8');

// Add restrictToBasicInfo prop
content = content.replace(
  /doctors: Doctor\[\];\n\}/,
  'doctors: Doctor[];\n  restrictToBasicInfo?: boolean;\n}'
);

content = content.replace(
  /doctors \} = /,
  'doctors, restrictToBasicInfo = false } = '
);

content = content.replace(
  /\{\/\* Section 2: Medical Details \*\/\}/,
  '{!restrictToBasicInfo && (\n            <>\n            {/* Section 2: Medical Details */}'
);

content = content.replace(
  /<\/div>\n\n          <div className=\"flex gap-4 pt-8\">/,
  '          </>\n          )}\n          </div>\n\n          <div className=\"flex gap-4 pt-8\">'
);

fs.writeFileSync('components/admin/PatientFormModal.tsx', content);
