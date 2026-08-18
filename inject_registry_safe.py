import os
import re

files = [
    'views/StaffCheckin.tsx',
    'views/StaffDoctor.tsx',
    'views/StaffTreatment.tsx',
    'views/StaffPharmacy.tsx',
    'views/StaffLab.tsx',
    'views/StaffWardCare.tsx',
    'views/StaffBilling.tsx',
    'views/StaffVisitorMgmt.tsx',
    'views/StaffAttendantMgmt.tsx'
]

for file in files:
    if not os.path.exists(file):
        continue

    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import if missing
    if 'RegistryTable' not in content:
        content = re.sub(r'(import .*?;)', r'\1\nimport { RegistryTable } from \'../components/RegistryTable\';', content, count=1)

    # We need to wrap the whole return statement.
    # Find `return (` for the main component. Usually it's the last one in the file.
    # We can split the string by `return (`.
    parts = content.rsplit('return (', 1)
    if len(parts) == 2:
        before = parts[0]
        after = parts[1]
        
        # In `after`, we need to find the matching `)` for the `return (`
        # Wait, since it's `return (\n  <div ... \n  </div>\n);`, we can just replace the LAST `);` in `after`.
        # Because the main component return always ends with `);` right before the end of the file.
        
        last_paren_idx = after.rfind(');')
        if last_paren_idx != -1:
            # Everything inside `return (` ... `);`
            inside = after[:last_paren_idx]
            rest = after[last_paren_idx+2:]
            
            # Re-wrap
            new_return = (
                'return (\n'
                '    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n'
                '      <div className="shrink-0 flex-1">\n'
                f'        {inside}\n'
                '      </div>\n'
                '      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n'
                '        <RegistryTable patients={typeof patients !== "undefined" ? patients : []} theme={theme} onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} hideCategoryFilter={true} />\n'
                '      </div>\n'
                '    </div>\n'
                ');'
            )
            
            content = before + new_return + rest
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
