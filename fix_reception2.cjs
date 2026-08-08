
const fs = require('fs');
const file = 'views/StaffReception.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Fix the update function
  code = code.replace(/updateCurrentPatient\(\{ allowPhotoOnDisplay/g, 'mockFirestore.updatePatient(currentPatient.id, { allowPhotoOnDisplay');

  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed StaffReception checkbox');
}

