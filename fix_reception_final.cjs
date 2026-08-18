const fs = require('fs');

const file = 'views/StaffReception.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will just git checkout StaffReception and apply a perfect clean fix.
// Instead of that, I can just replace the end block directly!

content = content.replace(
    '        </div>\n        </div>\n        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n          <RegistryTable patients={patients} theme={theme} onEdit={onEditPatient} onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} hideCategoryFilter={true} />\n        </div>\n      </div>\n    );\n  };\n  \n  export default StaffReception;',
    '        </div>\n        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n          <RegistryTable patients={patients} theme={theme} onEdit={onEditPatient} onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} hideCategoryFilter={true} />\n        </div>\n      </div>\n    );\n  };\n  \n  export default StaffReception;'
);

// If the indentation was different:
content = content.replace(
    /<\/div>\s*<\/div>\s*<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white\/5 pt-8\s*shrink-0">\s*<RegistryTable patients=\{patients\} theme=\{theme\} onEdit=\{onEditPatient\} onRowClick=\{\(p\) => isAdmin &&\s*setTimelinePatient && setTimelinePatient\(p\)\} hideCategoryFilter=\{true\} \/>\s*<\/div>\s*<\/div>\s*\);\s*\};\s*export default StaffReception;/,
    '        </div>\n        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n          <RegistryTable patients={patients} theme={theme} onEdit={onEditPatient} onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} hideCategoryFilter={true} />\n        </div>\n      </div>\n    );\n  };\n  \n  export default StaffReception;'
);

fs.writeFileSync(file, content);
console.log('Fixed Reception End');
