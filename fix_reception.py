import re

file = 'views/StaffReception.tsx'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inner RegistryTable (already done probably, let's check)
if 'Select a patient to begin' not in content:
    content = re.sub(
        r'<\s*RegistryTable[\s\S]*?handleRequestDelete\s*\}[\s\S]*?\/>',
        '<div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest font-black text-sm">Select a patient to begin</div>',
        content
    )

# Replace return wrap
if 'custom-scrollbar' not in content:
    content = content.replace(
        '  return (\n    <div className={`h-[calc(100vh-6rem)] w-full flex gap-4 p-4 overflow-hidden ${s.bg}`}>',
        '  return (\n    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">\n      <div className={`shrink-0 min-h-[600px] h-[calc(100vh-6rem)] w-full flex gap-4 p-4 overflow-hidden ${s.bg}`}>'
    )

# Replace end
if 'hideCategoryFilter' not in content:
    content = re.sub(
        r'\s*</div>\s*\);\s*};\s*export default StaffReception;',
        '\n      </div>\n      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8 shrink-0">\n        <RegistryTable patients={patients} theme={theme} onEdit={onEditPatient} onRowClick={(p) => isAdmin && setTimelinePatient && setTimelinePatient(p)} hideCategoryFilter={true} />\n      </div>\n    </div>\n  );\n};\n\nexport default StaffReception;',
        content
    )

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated StaffReception.tsx')
