const fs = require('fs');

const file = 'views/StaffCheckin.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Registry Pipeline
content = content.replace(
    /<section className="space-y-8">\s*<h3 className=\{`text-xl sm:text-2xl font-black uppercase tracking-tight \$\{s\.header\}`\}>Registry Pipeline[\s\S]*?<\/section>\s*\{\/\* Processed Registry \*\/\}\s*<section className="space-y-4 pt-6 border-t border-white\/5">[\s\S]*?<\/section>\s*<\/div>/,
    '</div>'
);

// 2. Wrap main return and append RegistryTable
content = content.replace(
    '  return (\n    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:p-6 sm:gap-10">',
    '  return (\n    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n      <div className="shrink-0 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:p-6 sm:gap-10">'
);

content = content.replace(
    '      </div>\n    </div>\n  );\n};\n\nexport default StaffCheckin;',
    '      </div>\n    </div>\n      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n        <RegistryTable \n          patients={patients} \n          theme={theme} \n          onEdit={onEditPatient} \n          onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} \n          hideCategoryFilter={true} \n        />\n      </div>\n    </div>\n  );\n};\n\nexport default StaffCheckin;'
);

// Add import if missing
if (!content.includes('RegistryTable')) {
    content = content.replace(/(import .*?;)/, '$1\nimport { RegistryTable } from \'../components/RegistryTable\';');
}

fs.writeFileSync(file, content);
console.log('Updated StaffCheckin.tsx');
