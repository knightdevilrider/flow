const fs = require('fs');
const file = 'components/admin/PatientFormModal.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  if (!code.includes('LOCALITY_DATABASE')) {
    code = code.replace(/import { Patient, Theme, PatientCategory, PatientStatus, Doctor } from '..\/..\/types';/, 
      "import { Patient, Theme, PatientCategory, PatientStatus, Doctor } from '../../types';\nimport { AreaAutocomplete } from '../AreaAutocomplete';\nimport { LOCALITY_DATABASE } from '../../constants';");
  }

  if (!code.includes('const [isManualArea, setIsManualArea]')) {
    code = code.replace(/const \[formData, setFormData\] = useState<Partial<Patient>>\(\{/,
      "const [isManualArea, setIsManualArea] = useState(false);\n  const [formData, setFormData] = useState<Partial<Patient>>({");
  }

  if (!code.includes('const handleLocalitySelect =')) {
    code = code.replace(/const handleSubmit = \(e: React.FormEvent\) => \{/,
      "const handleLocalitySelect = (locality: any) => {\n    setFormData(prev => ({\n      ...prev,\n      area: locality.name,\n      pincode: locality.pincode,\n      geographicZone: locality.zone\n    }));\n    setIsManualArea(false);\n  };\n\n  const handlePincodeChange = (pin: string) => {\n    const cleanedPin = pin.replace(/\\D/g, '').slice(0, 6);\n    setFormData(prev => ({ ...prev, pincode: cleanedPin }));\n    if (cleanedPin.length === 6) {\n      const match = LOCALITY_DATABASE.find(l => l.pincode === cleanedPin);\n      if (match) {\n        setFormData(prev => ({\n          ...prev,\n          area: match.name,\n          geographicZone: match.zone\n        }));\n        setIsManualArea(false);\n      }\n    }\n  };\n\n  const handleSubmit = (e: React.FormEvent) => {");
  }

  code = code.replace(
    /<div className="space-y-2">\s*<label className={	ext-\[9px\] font-black uppercase tracking-widest ml-1 \$\{s.label\}>Area<\/label>\s*<input\s*type="text" placeholder="Area"\s*value=\{formData.area \|\| ''\} onChange=\{e => setFormData\(\{\.\.\.formData, area: e.target.value\}\)\}\s*className=\{w-full px-6 py-4 rounded-2xl border outline-none font-bold \$\{s.input\}\}\s*\/>\s*<\/div>\s*<div className="space-y-2">\s*<label className={	ext-\[9px\] font-black uppercase tracking-widest ml-1 \$\{s.label\}>Pincode<\/label>\s*<input\s*type="text" placeholder="Pincode"\s*value=\{formData.pincode \|\| ''\} onChange=\{e => setFormData\(\{\.\.\.formData, pincode: e.target.value\}\)\}/g,
    <div className="space-y-2">
                <label className={\	ext-[9px] font-black uppercase tracking-widest ml-1 \\}>Area</label>
                <AreaAutocomplete 
                  value={formData.area || ''} 
                  onSelectLocality={handleLocalitySelect}
                  onManualChange={(val) => setFormData({ ...formData, area: val })}
                  theme={theme}
                  styles={s}
                  isManualMode={isManualArea}
                  selectedZone={(formData.geographicZone as any) || 'Urban-Ahmednagar'}
                />
              </div>
              <div className="space-y-2">
                <label className={\	ext-[9px] font-black uppercase tracking-widest ml-1 \\}>Pincode</label>
                <input
                  type="text" placeholder="Pincode" maxLength={6}
                  value={formData.pincode || ''} onChange={e => handlePincodeChange(e.target.value)}
  );

  fs.writeFileSync(file, code);
  console.log('Fixed PatientFormModal.tsx');
}
