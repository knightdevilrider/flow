const fs = require('fs');

const files = [
    'views/StaffCheckin.tsx',
    'views/StaffDoctor.tsx',
    'views/StaffTreatment.tsx',
    'views/StaffPharmacy.tsx',
    'views/StaffLab.tsx',
    'views/StaffRadiology.tsx',
    'views/StaffWardCare.tsx',
    'views/StaffBilling.tsx',
    'views/StaffVisitorMgmt.tsx',
    'views/StaffAttendantMgmt.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add RegistryTable import if not exists
    if (!content.includes('RegistryTable')) {
        content = content.replace(/(import .*?;)/, '$1\nimport { RegistryTable } from \'../components/RegistryTable\';');
    }

    // Match the final closing tags and export default.
    const endMatch = content.match(/(\s*<\/[a-zA-Z0-9_]+>\s*\);\s*\};\s*export default [A-Za-z0-9_]+;?\s*)$/);
    if (endMatch) {
       const replacement = `
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">
        <RegistryTable patients={typeof patients !== "undefined" ? patients : (typeof orders !== "undefined" ? orders : []) as any} theme={theme} onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} onRowClick={typeof setTimelinePatient !== "undefined" ? (p) => isAdmin && setTimelinePatient(p) : undefined} hideCategoryFilter={true} />
      </div>` + endMatch[1];
       content = content.substring(0, endMatch.index) + replacement;
       fs.writeFileSync(file, content);
       console.log('Updated', file);
    } else {
       console.log('Failed to match end of file for', file);
    }
  }
});
