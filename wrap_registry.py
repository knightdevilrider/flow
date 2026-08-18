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
        
    # We want to replace the first `return (` of the main component with the wrapper.
    # Note: StaffRadiology has `return (` inside a map perhaps?
    # Let's use regex to find `  return (\n    <div` or `  return (\n    <main` or `  return (\n    <section`
    
    # We will match the first `  return (` followed by a tag
    
    match = re.search(r'^[ \t]*return \(\s*<([a-zA-Z]+)([^>]*?)>', content, re.MULTILINE)
    if not match:
        print("Could not find root for", file)
        continue
        
    tag = match.group(1)
    attrs = match.group(2)
    
    # We want to wrap the returned element inside:
    # <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">
    #   <div className="shrink-0 w-full ...">  <-- wait, instead of creating a new div, we can just add `shrink-0` to the original root's class, but it's safer to just wrap it in a shrink-0 container.
    # Actually, we can just do:
    # return (
    #   <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">
    #     <div className="shrink-0">
    #       <OriginalRoot> ...
    
    replacement_start = f'  return (\n    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n      <div className="shrink-0 w-full">\n        <{tag}{attrs}>'
    
    # Now we need to find the matching closing tag at the end of the file.
    # It will be: `</tag>\n  );\n};\n\nexport default`
    
    end_regex = r'^[ \t]*</' + tag + r'>\s*\);\s*};\s*export default'
    end_match = re.search(end_regex, content, re.MULTILINE)
    
    if not end_match:
        print("Could not find end for", file)
        # Try matching any closing tag
        end_regex = r'^[ \t]*</[a-zA-Z]+>\s*\);\s*};\s*export default'
        end_match = re.search(end_regex, content, re.MULTILINE)
        if not end_match:
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
    content = content[:match.start()] + replacement_start + content[match.end():end_match.start()] + registry_injection + content[end_match.end()-len('export default'):]
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Updated", file)
