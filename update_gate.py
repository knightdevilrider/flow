import re

with open('views/StaffGate.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Selection View Grid
pattern1 = re.compile(r'\{\/\* Processed Registry \(Selection View\) \*\/\}[\s\S]*?(?=<\/div>\n \n \);)', re.MULTILINE)
replacement1 = """{/* Processed Registry (Selection View) */}
 <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto mt-12 pb-10 border-t border-white/5 pt-8">
   <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} hideCategoryFilter={true} />
 </div>"""
content = pattern1.sub(replacement1, content)

# Replace Form View Grid
pattern2 = re.compile(r'\{\/\* Processed Registry \(Form View\) \*\/\}[\s\S]*?(?=<\/div>\n <\/div>\n <\/div>\n \);)', re.MULTILINE)
replacement2 = """{/* Processed Registry (Form View) */}
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8">
   <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} hideCategoryFilter={true} />
 </div>"""
content = pattern2.sub(replacement2, content)

with open('views/StaffGate.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
