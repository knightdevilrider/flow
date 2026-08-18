const fs = require('fs');

let content = fs.readFileSync('views/StaffGate.tsx', 'utf8');

content = content.replace(
  /import\{ getPremiumStyles\} from '\.\.\/theme\/premiumDesign';/,
  "import{ getPremiumStyles} from '../theme/premiumDesign';\nimport { RegistryTable } from '../components/RegistryTable';\nimport PatientFormModal from '../components/admin/PatientFormModal';"
);

content = content.replace(
  /const \[step, setStep\] = useState<'selection' \| 'form'>\('selection'\);/,
  "const [step, setStep] = useState<'selection' | 'form'>('selection');\n  const [editPatient, setEditPatient] = useState<Patient | null>(null);\n\n  const handleSaveEdit = async (updatedData) => {\n    if (editPatient) {\n      await mockFirestore.updatePatient(editPatient.id, updatedData);\n      setEditPatient(null);\n    }\n  };\n\n  const gatePatients = patients.filter(p => p.status === PatientStatus.GATE_REGISTERED || p.status === PatientStatus.RECEPTION_WAITING);"
);

content = content.replace(
  /\{\/\* Processed Registry \(Selection View\) \*\/\}[\s\S]*?<\/div>\n <\/div>\n \);/g,
  "{/* Processed Registry (Selection View) */}\n <div className=\"w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto mt-12 pb-10 border-t border-white/5 pt-8\">\n   <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} hideCategoryFilter={true} />\n </div>\n </div>\n );"
);

content = content.replace(
  /\{\/\* Processed Registry \(Form View\) \*\/\}[\s\S]*?<\/div>\n <\/div>\n <\/div>\n \);/g,
  "{/* Processed Registry (Form View) */}\n <div className=\"w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8\">\n   <RegistryTable patients={gatePatients} theme={theme} onEdit={setEditPatient} hideCategoryFilter={true} />\n </div>\n </div>\n </div>\n <PatientFormModal isOpen={!!editPatient} onClose={() => setEditPatient(null)} onSave={handleSaveEdit} initialData={editPatient} theme={theme} doctors={[]} restrictToBasicInfo={true} />\n );"
);

fs.writeFileSync('views/StaffGate.tsx', content);
