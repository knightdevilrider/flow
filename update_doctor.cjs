const fs = require('fs');

const file = 'views/StaffDoctor.tsx';
let content = fs.readFileSync(file, 'utf8');

// The main return we want to wrap starts at line ~241:
// `  return (\n    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-4 gap-3 sm:p-6">`
// We will replace it safely.

content = content.replace(
    '  return (\n    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-4 gap-3 sm:p-6">',
    '  return (\n    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n      <div className="shrink-0 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-4 gap-3 sm:p-6">'
);

// Match the end of the file
content = content.replace(
    '      </div>\n    </div>\n  );\n};\nexport default StaffDoctor;',
    '      </div>\n    </div>\n      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n        <RegistryTable \n          patients={typeof patients !== "undefined" ? patients : []} \n          theme={theme} \n          onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} \n          onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} \n          hideCategoryFilter={true} \n        />\n      </div>\n    </div>\n  );\n};\n\nexport default StaffDoctor;'
);

if (content.includes('export default StaffDoctor;') && !content.includes('RegistryTable patients={typeof patients !== "undefined" ? patients : []}')) {
    // If it didn't match the exact end, try an alternative
    content = content.replace(
        '      </div>\n    </div>\n  );\n};\n\nexport default StaffDoctor;',
        '      </div>\n    </div>\n      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n        <RegistryTable \n          patients={typeof patients !== "undefined" ? patients : []} \n          theme={theme} \n          onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} \n          onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} \n          hideCategoryFilter={true} \n        />\n      </div>\n    </div>\n  );\n};\n\nexport default StaffDoctor;'
    );
}

// Add import if missing
if (!content.includes('RegistryTable')) {
    content = content.replace(/(import .*?;)/, '$1\nimport { RegistryTable } from \'../components/RegistryTable\';');
}

fs.writeFileSync(file, content);
console.log('Updated StaffDoctor.tsx');
