import os
import re

files = [
    'views/StaffCheckin.tsx',
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

    # Add import if missing
    if 'RegistryTable' not in content:
        content = re.sub(r'(import .*?;)', r"\1\nimport { RegistryTable } from '../components/RegistryTable';", content, count=1)

    # Find the main return ( just before ); }; export default )
    # The structure at the end of the file is typically:
    #      </div>
    #    );
    #  };
    #
    #  export default StaffXXX;
    
    # Let's find "};" followed by "export default"
    match = re.search(r'\};\s*export default', content)
    if not match:
        print(f"Skipping {file} (could not find export default)")
        continue
        
    export_idx = match.start()
    
    # Find the last `);` before `export_idx`
    last_paren_idx = content.rfind(');', 0, export_idx)
    if last_paren_idx == -1:
        print(f"Skipping {file} (could not find last ); )")
        continue

    # Now we need to find the `return (` that matches this `);`.
    # Since they could be nested, a simple string search isn't perfect, 
    # but the root `return (` of the component is the one we want to wrap.
    # Actually, we don't even need to wrap it if we just inject the RegistryTable *before* the last closing tag!
    # Wait, if we just inject it before the last </div>, it will be inside the current root.
    # The current root might be a grid, or a flex container. If we inject a 100% width block inside a grid, it might break.
    # It's better to wrap the ENTIRE return content.
    
    # Let's find the matching `return (`. 
    # Because `return (` is distinct, we can count open/close brackets, or just find the main `return (` by looking for `return (` that is at the outer-most level.
    # Actually, the simplest approach: we can just find the LAST `return (` that is indented by 2 spaces (i.e. `  return (`).
    
    main_return_match = None
    for m in re.finditer(r'^[ \t]*return \($', content[:last_paren_idx], re.MULTILINE):
        main_return_match = m
        
    if not main_return_match:
        # Try without strict newline/indent matching
        for m in re.finditer(r'return \(', content[:last_paren_idx]):
            main_return_match = m
            
    if not main_return_match:
        print(f"Skipping {file} (could not find main return)")
        continue
        
    return_start_idx = main_return_match.start()
    return_end_idx = main_return_match.end()
    
    before = content[:return_start_idx]
    inside = content[return_end_idx:last_paren_idx]
    after = content[last_paren_idx:]
    
    # Re-wrap
    new_return = (
        'return (\n'
        '    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n'
        '      <div className="shrink-0 flex-1 w-full">\n'
        f'        {inside}\n'
        '      </div>\n'
        '      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n'
        '        <RegistryTable patients={typeof patients !== "undefined" ? patients : (typeof orders !== "undefined" ? orders : []) as any} theme={theme} onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} onRowClick={typeof setTimelinePatient !== "undefined" ? (p) => isAdmin && setTimelinePatient(p) : undefined} hideCategoryFilter={true} />\n'
        '      </div>\n'
        '    </div>\n'
    )
    
    content = before + new_return + after
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully updated {file}")
