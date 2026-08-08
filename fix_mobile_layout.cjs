const fs = require('fs');

const filesToFix = [
  'views/StaffDoctor.tsx',
  'views/StaffPharmacy.tsx',
  'views/StaffTreatment.tsx'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Fix sidebar
    code = code.replace(
      /<div className="hidden lg:block lg:col-span-1">/g,
      '<div className="lg:col-span-1 order-last lg:order-first mt-8 lg:mt-0">'
    );
    
    fs.writeFileSync(file, code, 'utf8');
    console.log('Fixed sidebar in:', file);
  }
});

const mainDashPath = 'views/MainDashboard.tsx';
if (fs.existsSync(mainDashPath)) {
  let code = fs.readFileSync(mainDashPath, 'utf8');
  // Add pt-20 on small screens so the content is below the mobile nav
  code = code.replace(
    /className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-20 pt-2 flex flex-col items-center relative"/g,
    'className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-20 pt-20 sm:pt-2 flex flex-col items-center relative"'
  );
  fs.writeFileSync(mainDashPath, code, 'utf8');
  console.log('Fixed padding in MainDashboard');
}
