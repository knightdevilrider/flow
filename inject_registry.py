import re
import os

files = [
    'views/StaffReception.tsx',
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
        
    # Check if RegistryTable is imported
    if 'RegistryTable' not in content:
        # insert after first import
        content = re.sub(r'(import .*?;)', r'\1\nimport { RegistryTable } from \'../components/RegistryTable\';', content, count=1)
        
    # For StaffReception, we need to remove the internal RegistryTable call
    if 'StaffReception' in file:
        content = re.sub(
            r'<\s*RegistryTable[\s\S]*?/>', 
            '<div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest font-black text-sm">Select a patient to begin</div>', 
            content, 
            count=1
        )
        
    # Replace the main return wrapper
    # We find the last `return (` block. This is slightly tricky, we will regex from the end.
    # Actually, we can use a simpler approach. We wrap the entire return statement.
    # But since we just want to append to the end of the root container:
    
    # In most files, the root container is a single div.
    # The end of the component looks like:
    #    </div>
    #   );
    # };
    # export default StaffXXX;
    
    # Let's replace the last </div> before ); }; export with:
    #    </div>
    #    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8">
    #      <RegistryTable patients={typeof patients !== "undefined" ? patients : []} theme={theme} onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} hideCategoryFilter={true} />
    #    </div>
    # </div>
    
    # And we need to make sure the root container is wrapped in our custom wrapper.
    # Actually, if we just inject this right before the last </div>, it will be inside the root container.
    # If the root container is flex (which it usually is), we should just make sure it's flex-col if we want it below.
    # Many are `grid` or `flex h-[calc]`.
    
    # Instead, let's replace the LAST `return (` with:
    # return ( <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar"> <div className="flex-1 shrink-0">
    # And replace the LAST `);` with:
    # </div> <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0 bg-black/20"><RegistryTable patients={typeof patients !== "undefined" ? patients : []} theme={theme} onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} hideCategoryFilter={true} /></div></div> );
    
    # Find last 'return ('
    last_return_idx = content.rfind('return (')
    
    if last_return_idx != -1:
        # Split into before and after
        before_return = content[:last_return_idx]
        after_return = content[last_return_idx:]
        
        # In after_return, find the last `);`
        last_paren_idx = after_return.rfind(');')
        
        if last_paren_idx != -1:
            inside_return = after_return[8:last_paren_idx] # skip 'return ('
            rest = after_return[last_paren_idx+2:]
            
            # Reconstruct
            new_return = (
                'return (\n'
                '    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n'
                '      <div className="shrink-0 flex-1">\n'
                f'{inside_return}\n'
                '      </div>\n'
                '      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n'
                '        <RegistryTable patients={typeof patients !== "undefined" ? patients : []} theme={theme} onEdit={typeof onEditPatient !== "undefined" ? onEditPatient : undefined} hideCategoryFilter={true} />\n'
                '      </div>\n'
                '    </div>\n'
                ');'
            )
            
            content = before_return + new_return + rest

            # Remove h-full / h-screen / h-[calc(100vh-100px)] from the old root which might cause issues
            # Actually, `shrink-0` means it can retain its size. If it's h-full, it will fill at least the screen.
            # So scrolling will still work!

            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
