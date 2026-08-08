
const fs = require('fs');

function fixStaffForm(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Remove the block {formData.publicDisplayConsent && ( ... )} completely
  const regex = /\{formData\.publicDisplayConsent && \([\s\S]*?\}\s*<\/div>\s*\)\}/g;
  code = code.replace(regex, '');

  fs.writeFileSync(filePath, code, 'utf8');
}

fixStaffForm('views/StaffGate.tsx');
fixStaffForm('views/StaffReception.tsx');

let pubData = fs.readFileSync('views/PublicDisplayView.tsx', 'utf8');
// replace photoUrl with photo
pubData = pubData.replace(/patient\.photoUrl/g, 'patient.photo');
fs.writeFileSync('views/PublicDisplayView.tsx', pubData);

console.log('Fixed photo fields');

