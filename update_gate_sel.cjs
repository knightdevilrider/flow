const fs = require('fs');
let content = fs.readFileSync('views/StaffGate.tsx', 'utf8');
const regex = /\{\/\* Processed Registry \(Selection View\) \*\/\}[\s\S]*?(?=<\/div>\n \n \);)/;
const replacement = `{/* Processed Registry (Selection View) */}
 <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto mt-12 pb-10 border-t border-white/5 pt-8">
   <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} hideCategoryFilter={true} />
 </div>`;
content = content.replace(regex, replacement);
fs.writeFileSync('views/StaffGate.tsx', content);
