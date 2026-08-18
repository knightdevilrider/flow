import re

with open('components/RegistryTable.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update props
content = re.sub(
    r"onDelete\?: \(patient: Patient\) => void;",
    "onDelete?: (patient: Patient) => void;\n  onRowClick?: (patient: Patient) => void;",
    content
)

# Extract RegistryTable from const RegistryTable to the end so we can safely modify it
# Actually just doing simple regex on the file

content = re.sub(r'<th className="px-4 py-3 font-black">Contact & Area</th>\n', '', content)
content = re.sub(r'<th className="px-4 py-3 font-black">Status</th>\n', '', content)

# Remove Contact & Area td
content = re.sub(
    r'<td className="px-4 py-3">\s*<div className="flex flex-col gap-1">\s*<div className="flex items-center gap-1\.5 text-xs opacity-80">\s*<Phone className="w-3 h-3" />\s*<span>\{p\.phone \|\| \'No Phone\'\}</span>\s*</div>\s*<div className="flex items-center gap-1\.5 text-xs opacity-80">\s*<MapPin className="w-3 h-3" />\s*<span className="truncate max-w-\[150px\]">\{p\.area \|\| p\.address \|\| \'No Address\'\}</span>\s*</div>\s*</div>\s*</td>\s*',
    '',
    content
)

# Remove Status td
content = re.sub(
    r'<td className="px-4 py-3">\s*<div className="flex flex-col">\s*<span className="text-xs font-bold text-blue-400">\{STATUS_LABELS\[p\.status\] \|\| p\.status\}</span>\s*\{p\.deletionRequest && \(\s*<span className="text-\[9px\] font-black uppercase text-red-400 mt-1 flex items-center gap-1">\s*<Trash2 className="w-3 h-3" />\s*Delete Requested\s*</span>\s*\)\}\s*</div>\s*</td>\s*',
    '',
    content
)

# Make row clickable and fix hover state
content = re.sub(
    r'<tr key=\{p\.id\} className=\{\`border-b border-white/5 hover:bg-white/5 transition-colors group\`\}>',
    r'<tr key={p.id} onClick={() => onRowClick?.(p)} className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${onRowClick ? \'cursor-pointer\' : \'\'}`}>',
    content
)

# Fix actions opacity
content = re.sub(
    r'<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">',
    r'<div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">',
    content
)

# We need to add the PatientTimelineModal to RegistryTable?
# NO, we add it to StaffGate, StaffReception, AdminConsole.
# BUT we need to add `onRowClick` to the destructured props in RegistryTable.
content = re.sub(
    r'hideCategoryFilter = false\n}\) => \{',
    r'hideCategoryFilter = false,\n  onRowClick\n}) => {',
    content
)

with open('components/RegistryTable.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
