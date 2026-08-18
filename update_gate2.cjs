const fs = require('fs');

let content = fs.readFileSync('views/StaffGate.tsx', 'utf8');

// 1. Add imports at the top
content = content.replace(
  /import\{ getPremiumStyles\} from '\.\.\/theme\/premiumDesign';/,
  "import{ getPremiumStyles} from '../theme/premiumDesign';\nimport { RegistryTable } from '../components/RegistryTable';\nimport PatientFormModal from '../components/admin/PatientFormModal';"
);

// 2. Add state and handlers
content = content.replace(
  /const \[step, setStep\] = useState<'selection' \| 'form'>\('selection'\);/,
  "const [step, setStep] = useState<'selection' | 'form'>('selection');\n  const [editPatient, setEditPatient] = useState<Patient | null>(null);\n\n  const handleSaveEdit = async (updatedData) => {\n    if (editPatient) {\n      await mockFirestore.updatePatient(editPatient.id, updatedData);\n      setEditPatient(null);\n    }\n  };"
);

// 3. Define gatePatients variable right before the returns
content = content.replace(
  /const renderContent = \(\) => \{/,
  "const gatePatients = patients.filter(p => p.status === PatientStatus.GATE_REGISTERED || p.status === PatientStatus.RECEPTION_WAITING);\n\n  const renderContent = () => {"
);

// 4. Add the PatientFormModal right before the final export statement
content = content.replace(
  /export default StaffGate;/,
  "  return (\n    <>\n      {renderContent()}\n      <PatientFormModal \n        isOpen={!!editPatient}\n        onClose={() => setEditPatient(null)}\n        onSave={handleSaveEdit}\n        initialData={editPatient}\n        theme={theme}\n        doctors={[]}\n        restrictToBasicInfo={true}\n      />\n    </>\n  );\n}\n\nexport default StaffGate;"
);
// Wait, StaffGate doesn't just return `renderContent()`. Let's see how it returns.
// Wait, I will just write a script to check how it returns first.
