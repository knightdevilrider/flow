const fs = require('fs');
let content = fs.readFileSync('views/StaffGate.tsx', 'utf8');

// Add the prop
content = content.replace(
  /onDeletePatient\?: \(p: Patient\) => void;\n\}/,
  "onDeletePatient?: (p: Patient) => void;\n  setBackInterceptor?: (handler: (() => boolean) | null) => void;\n}"
);

content = content.replace(
  /const StaffGate: React\.FC<StaffGateProps> = \(\{ patients, theme, waitingCount, isAdmin, onEditPatient, onDeletePatient\}\) =>\{/,
  "const StaffGate: React.FC<StaffGateProps> = ({ patients, theme, waitingCount, isAdmin, onEditPatient, onDeletePatient, setBackInterceptor }) =>{"
);

// Replace the useEffect for app-back-button with setBackInterceptor
content = content.replace(
  /useEffect\(\(\) => \{\n    const handleAppBack = \(e\) => \{\n      if \(step === 'form'\) \{\n        e\.preventDefault\(\);\n        setStep\('selection'\);\n      \}\n    \};\n    window\.addEventListener\('app-back-button', handleAppBack\);\n    return \(\) => window\.removeEventListener\('app-back-button', handleAppBack\);\n  \}, \[step\]\);/,
  "useEffect(() => {\n    if (setBackInterceptor) {\n      setBackInterceptor(() => {\n        if (step === 'form') {\n          setStep('selection');\n          return true;\n        }\n        return false;\n      });\n    }\n    return () => {\n      if (setBackInterceptor) setBackInterceptor(null);\n    };\n  }, [step, setBackInterceptor]);"
);

fs.writeFileSync('views/StaffGate.tsx', content);
console.log('StaffGate.tsx updated');
