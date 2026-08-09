const fs = require('fs');

const files = [
  'components/admin/PatientFormModal.tsx',
  'components/AdminAuthModal.tsx',
  'components/admin/DeletePatientModal.tsx',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Responsive modal container (w-[800px] -> w-[95vw] max-w-3xl)
  content = content.replace(/w-\[800px\]/g, 'w-[95vw] sm:w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto');
  content = content.replace(/w-96/g, 'w-[95vw] sm:w-96 max-w-md max-h-[90vh] overflow-y-auto');
  content = content.replace(/w-\[600px\]/g, 'w-[95vw] sm:w-[600px] max-w-2xl max-h-[90vh] overflow-y-auto');

  // Fix padding inside modals for mobile
  content = content.replace(/p-10/g, 'p-6 sm:p-10');
  content = content.replace(/p-8/g, 'p-5 sm:p-8');
  content = content.replace(/p-6/g, 'p-4 sm:p-6');
  
  fs.writeFileSync(file, content);
}
