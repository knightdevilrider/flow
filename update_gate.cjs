const fs = require('fs');

let content = fs.readFileSync('views/StaffGate.tsx', 'utf8');

// Add imports
if (!content.includes('RegistryTable')) {
  content = content.replace(
    /import \{ getPremiumStyles \} from '\.\.\/theme\/premiumDesign';/,
    "import { getPremiumStyles } from '../theme/premiumDesign';\nimport { RegistryTable } from '../components/RegistryTable';\nimport PatientFormModal from '../components/admin/PatientFormModal';"
  );
}

// Add state for modal
if (!content.includes('editPatient')) {
  content = content.replace(
    /const \[registryFilter, setRegistryFilter\] = useState<string>\(\(\) =>\{/,
    "const [editPatient, setEditPatient] = useState<Patient | null>(null);\n const [registryFilter, setRegistryFilter] = useState<string>(() =>{"
  );
}

// Add save handler
if (!content.includes('handleSaveEdit')) {
  content = content.replace(
    /const handleCategorySelect = \(cat: PatientCategory\) =>\{/,
    "const handleSaveEdit = async (updatedData) => {\n    if (editPatient) {\n      await mockFirestore.updatePatient(editPatient.id, updatedData);\n      setEditPatient(null);\n    }\n  };\n\n  const handleCategorySelect = (cat: PatientCategory) =>{"
  );
}

// Extract the gatePatients variable
if (!content.includes('const gatePatients =')) {
  content = content.replace(
    /const handleCategorySelect = \(cat: PatientCategory\) =>\{/,
    "const gatePatients = patients.filter(p => p.status === PatientStatus.GATE_REGISTERED || p.status === PatientStatus.RECEPTION_WAITING);\n\n  const handleCategorySelect = (cat: PatientCategory) =>{"
  );
}

// Add the modal at the bottom
content = content.replace(
  /<\/div>\n \n \);/,
  "\n  <PatientFormModal \n    isOpen={!!editPatient}\n    onClose={() => setEditPatient(null)}\n    onSave={handleSaveEdit}\n    initialData={editPatient}\n    theme={theme}\n    doctors={[]}\n    restrictToBasicInfo={true}\n  />\n</div>\n );"
);

// Replace the two grids
content = content.replace(
  /\{\/\* Processed Registry \(Selection View\) \*\/\}[\s\S]*?<\/div>\n \n <div className=\"w-full max-w-4xl/g,
  "{/* Processed Registry (Selection View) */}\n  <div className=\"px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10\">\n    <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} />\n  </div>\n\n <div className=\"w-full max-w-4xl"
);

content = content.replace(
  /\{\/\* Processed Registry \(Form View\) \*\/\}[\s\S]*?<\/div>\n<\/div>\n\n  <PatientFormModal/g,
  "{/* Processed Registry (Form View) */}\n  <div className=\"px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10\">\n    <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} />\n  </div>\n</div>\n\n  <PatientFormModal"
);

fs.writeFileSync('views/StaffGate.tsx', content);
