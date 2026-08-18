const fs = require('fs');

function updateFile(filename, replaceRegex, replacement) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /onEditPatient\?: \(p: Patient\) => void;\n\}/,
    "onEditPatient?: (p: Patient) => void;\n  setBackInterceptor?: (handler: (() => boolean) | null) => void;\n}"
  );
  content = content.replace(replaceRegex, replacement);
  
  // Replace the useEffect
  content = content.replace(
    /useEffect\(\(\) => \{\n    const handleAppBack = \(e: Event\) => \{\n      if \(viewingPatient\) \{\n        e\.preventDefault\(\);\n        setViewingPatient\(null\);\n      \}\n    \};\n    window\.addEventListener\('app-back-button', handleAppBack\);\n    return \(\) => window\.removeEventListener\('app-back-button', handleAppBack\);\n  \}, \[viewingPatient\]\);/,
    "useEffect(() => {\n    if (setBackInterceptor) {\n      setBackInterceptor(() => {\n        if (viewingPatient) {\n          setViewingPatient(null);\n          return true;\n        }\n        return false;\n      });\n    }\n    return () => {\n      if (setBackInterceptor) setBackInterceptor(null);\n    };\n  }, [viewingPatient, setBackInterceptor]);"
  );
  
  fs.writeFileSync(filename, content);
}

// StaffDoctor
updateFile(
  'views/StaffDoctor.tsx',
  /const StaffDoctor: React\.FC<StaffDoctorProps> = \(\{ patients, theme, doctors, isAdmin, onEditPatient\}\) =>\{/,
  "const StaffDoctor: React.FC<StaffDoctorProps> = ({ patients, theme, doctors, isAdmin, onEditPatient, setBackInterceptor }) =>{"
);

// StaffWardCare
updateFile(
  'views/StaffWardCare.tsx',
  /const StaffWardCare: React\.FC<StaffWardCareProps> = \(\{ patients, theme, wards, isAdmin, onEditPatient \}\) => \{/,
  "const StaffWardCare: React.FC<StaffWardCareProps> = ({ patients, theme, wards, isAdmin, onEditPatient, setBackInterceptor }) => {"
);

console.log('Doctor and Ward updated');
