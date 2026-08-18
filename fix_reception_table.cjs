const fs = require('fs');

const file = 'views/StaffReception.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace inner RegistryTable
content = content.replace(
    /<\s*RegistryTable[\s\S]*?handleRequestDelete\s*\}[\s\S]*?\/>/,
    '<div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest font-black text-sm">Select a patient to begin</div>'
);

// Replace return wrap
content = content.replace(
    '  return (\n    <div className={`h-[calc(100vh-6rem)] w-full flex gap-4 p-4 overflow-hidden ${s.bg}`}>',
    '  return (\n    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n      <div className={`shrink-0 min-h-[600px] h-[calc(100vh-6rem)] w-full flex gap-4 p-4 overflow-hidden ${s.bg}`}>'
);

// Replace end
content = content.replace(
    '      </div>\n    );\n  };\n  \n  export default StaffReception;',
    '      </div>\n      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n        <RegistryTable patients={patients} theme={theme} onEdit={onEditPatient} onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} hideCategoryFilter={true} />\n      </div>\n    </div>\n  );\n};\n\nexport default StaffReception;'
);

fs.writeFileSync(file, content);
console.log('Updated StaffReception.tsx');
