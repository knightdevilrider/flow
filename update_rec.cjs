const fs = require('fs');

let content = fs.readFileSync('views/StaffReception.tsx', 'utf8');

// 1. Add import for RegistryTable
content = content.replace(
  /import \{ \n  UserPlus, Search/,
  "import { RegistryTable } from '../components/RegistryTable';\nimport {\n  UserPlus, Search"
);

// 2. Add handleRequestDelete function
content = content.replace(
  /const handleProcessPayment = async \(\) => \{/,
  "const handleRequestDelete = async (patient: Patient) => {\n    const reason = window.prompt(`Request deletion for ${patient.name}? Please provide a reason:`);\n    if (reason && reason.trim() !== '') {\n      await mockFirestore.updatePatient(patient.id, {\n        deletionRequest: {\n          requestedBy: 'Reception',\n          reason: reason.trim(),\n          requestedAt: Date.now()\n        }\n      });\n      alert('Deletion request sent to Admin.');\n    }\n  };\n\n  const handleProcessPayment = async () => {"
);

// 3. Replace the placeholder
const regex = /<div className=\"flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8 opacity-50\">[\s\S]*?<\/div>\n        \)}/g;

const replacement = `<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">\n            <RegistryTable \n              patients={patients}\n              theme={theme}\n              onEdit={onEditPatient}\n              onDelete={handleRequestDelete}\n            />\n          </div>\n        )}`;

content = content.replace(regex, replacement);

fs.writeFileSync('views/StaffReception.tsx', content);
