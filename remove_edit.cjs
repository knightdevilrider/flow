const fs = require('fs');

const files = [
    'views/StaffDoctor.tsx',
    'views/StaffTreatment.tsx',
    'views/StaffPharmacy.tsx',
    'views/StaffLab.tsx',
    'views/StaffRadiology.tsx',
    'views/StaffWardCare.tsx',
    'views/StaffBilling.tsx',
    'views/StaffVisitorMgmt.tsx',
    'views/StaffAttendantMgmt.tsx',
    'views/StaffCheckin.tsx'
];

files.forEach(file => {
    if(fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Remove onEdit and onDelete props from the injected RegistryTable
        content = content.replace(/onEdit=\{typeof onEditPatient !== "undefined" \? onEditPatient : undefined\}\s*/g, '');
        content = content.replace(/onDelete=\{typeof onDeletePatient !== "undefined" \? onDeletePatient : undefined\}\s*/g, '');
        
        fs.writeFileSync(file, content);
    }
});

console.log('Removed edit/delete from other portals');
