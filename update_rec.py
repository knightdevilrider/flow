import re

with open('views/StaffReception.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r"import \{ \n  UserPlus, Search",
    "import { RegistryTable } from '../components/RegistryTable';\nimport {\n  UserPlus, Search",
    content
)

# 2. handleRequestDelete
content = re.sub(
    r"const handleProcessPayment = async \(\) => \{",
    "const handleRequestDelete = async (patient: Patient) => {\n    const reason = window.prompt(`Request deletion for ${patient.name}? Please provide a reason:`);\n    if (reason && reason.trim() !== '') {\n      await mockFirestore.updatePatient(patient.id, {\n        deletionRequest: {\n          requestedBy: 'Reception',\n          reason: reason.trim(),\n          requestedAt: Date.now()\n        }\n      });\n      alert('Deletion request sent to Admin.');\n    }\n  };\n\n  const handleProcessPayment = async () => {",
    content
)

# 3. Replace the outer fallback ONLY
fallback_regex = re.compile(
    r'        \) : \(\n          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8 opacity-50">\n            <PlayCircle className={`w-20 h-20 mb-6 \$\{s\.sub\}`} \/>\n            <h2 className={`text-2xl font-black mb-2 \$\{s\.text\}`}>Ready for Next Patient<\/h2>\n            <p className={`text-sm font-bold max-w-sm \$\{s\.sub\}`}>System is locked to strict First-Come-First-Serve mode\. Click "Auto-Call Next" in the inbox to process the oldest token\.<\/p>\n          <\/div>\n        \)}'
)

replacement = """        ) : (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <RegistryTable 
              patients={patients}
              theme={theme}
              onEdit={onEditPatient}
              onDelete={handleRequestDelete}
            />
          </div>
        )}"""

content = fallback_regex.sub(replacement, content)

with open('views/StaffReception.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
