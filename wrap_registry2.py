import os
import re

files = [
    'views/StaffDoctor.tsx',
    'views/StaffTreatment.tsx',
    'views/StaffPharmacy.tsx',
    'views/StaffLab.tsx',
    'views/StaffRadiology.tsx',
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

    # Ensure RegistryTable is imported
    if 'RegistryTable' not in content:
        content = re.sub(r'(import .*?;)', r"\1\nimport { RegistryTable } from '../components/RegistryTable';", content, count=1)
        
    # Find the main component start
    basename = os.path.basename(file).replace('.tsx', '')
    main_pattern = f'const {basename}:?[^=]*=\\s*\\([^)]*\\)\\s*=>\\s*{{'
    match_main = re.search(main_pattern, content)
    
    if not match_main:
        print("Could not find main component for", file)
        continue
        
    main_start = match_main.end()
    
    # We want to replace the first `return (` of the main component with the wrapper.
    match = re.search(r'^[ \t]*return \(\s*<([a-zA-Z]+)([^>]*?)>', content[main_start:], re.MULTILINE)
    if not match:
        print("Could not find root for", file)
        continue
        
    tag = match.group(1)
    attrs = match.group(2)
    
    replacement_start = f'  return (\n    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n      <div className="shrink-0 w-full">\n        <{tag}{attrs}>'
    
    end_regex = r'^[ \t]*</' + tag + r'>\s*\);\s*};\s*export default'
    end_match = re.search(end_regex, content, re.MULTILINE)
    
    if not end_match:
        end_regex = r'^[ \t]*</[a-zA-Z]+>\s*\);\s*};\s*export default'
        end_match = re.search(end_regex, content, re.MULTILINE)
        if not end_match:
            print("Could not find end for", file)
            continue
            
    # Replacement for end
    registry_injection = '''
        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">
        <RegistryTable 
          patients={typeof patients !== "undefined" ? patients : (typeof orders !== "undefined" ? orders : []) as any} 
          theme={theme} 
          onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} 
          onRowClick={typeof setTimelinePatient !== "undefined" ? (p) => isAdmin && setTimelinePatient(p) : undefined} 
          hideCategoryFilter={true} 
        />
      </div>
    </div>
  );
};
export default'''

    # Apply replacements
    final_content = content[:main_start + match.start()] + replacement_start + content[main_start + match.end():end_match.start()] + registry_injection + content[end_match.end()-len('export default'):]
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(final_content)
        
    print("Updated", file)
