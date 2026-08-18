const fs = require('fs');

const file = 'views/StaffReception.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the old RegistryTable from the middle column
content = content.replace(
    /<\s*RegistryTable[\s\S]*?onDelete=\{handleRequestDelete\}[\s\S]*?\/>/,
    '<div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest font-black text-sm">Select a patient to begin</div>'
);

// 2. Add the outer wrapper
// Look for the exact return start line. We will use string replacement.
// Note: we can use a regex that matches exactly the start of the div.
content = content.replace(
    /<div className=\{\`h-\[calc\(100vh-6rem\)\] w-full flex gap-4 p-4 overflow-hidden \$\{s\.bg\}\`\}>/g,
    '<div className="flex flex-col w-full">\n      <div className={`shrink-0 min-h-[600px] h-[calc(100vh-6rem)] w-full flex gap-4 p-4 overflow-hidden ${s.bg}`}>'
);

// 3. Add the RegistryTable to the bottom
content = content.replace(
    /      <\/div>\s*<\/div>\s*\);\s*\};\s*export default StaffReception;/g,
    `      </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">
        <RegistryTable patients={patients} theme={theme} onEdit={onEditPatient} onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} hideCategoryFilter={true} />
      </div>
    </div>
  );
};
export default StaffReception;`
);

fs.writeFileSync(file, content);
console.log('Fixed Reception Cleanly!');
