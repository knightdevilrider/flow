const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

if (!content.includes('backInterceptorRef')) {
  content = content.replace(
    /const \[currentRole, setCurrentRole\] = useState<UserRole \| null>\(null\);/,
    "const [currentRole, setCurrentRole] = useState<UserRole | null>(null);\n  const backInterceptorRef = useRef<(() => boolean) | null>(null);"
  );
  
  if (!content.includes('useRef')) {
    content = content.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
  }

  content = content.replace(
    /const handleBack = \(\) => \{\n    const event = new CustomEvent\('app-back-button', \{ cancelable: true \}\);\n    window.dispatchEvent\(event\);\n    if \(event.defaultPrevented\) return;/,
    "const handleBack = () => {\n    if (backInterceptorRef.current) {\n      const handled = backInterceptorRef.current();\n      if (handled) return;\n    }"
  );
  
  content = content.replace(
    /return <StaffGate patients=\{activePatients\} theme=\{theme\} waitingCount=\{activePatients\.length\} isAdmin=\{isAdminMode\} onEditPatient=\{handleEditPatient\} onDeletePatient=\{handleDeletePatient\} \/>;/,
    "return <StaffGate patients={activePatients} theme={theme} waitingCount={activePatients.length} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} setBackInterceptor={(handler) => { backInterceptorRef.current = handler; }} />;"
  );

  content = content.replace(
    /return <StaffDoctor patients=\{activePatients\} theme=\{theme\} doctors=\{doctors\} isAdmin=\{isAdminMode\} onEditPatient=\{handleEditPatient\} \/>;/,
    "return <StaffDoctor patients={activePatients} theme={theme} doctors={doctors} isAdmin={isAdminMode} onEditPatient={handleEditPatient} setBackInterceptor={(handler) => { backInterceptorRef.current = handler; }} />;"
  );

  content = content.replace(
    /return <StaffWardCare patients=\{activePatients\} theme=\{theme\} wards=\{wards\} isAdmin=\{isAdminMode\} onEditPatient=\{handleEditPatient\} \/>;/,
    "return <StaffWardCare patients={activePatients} theme={theme} wards={wards} isAdmin={isAdminMode} onEditPatient={handleEditPatient} setBackInterceptor={(handler) => { backInterceptorRef.current = handler; }} />;"
  );

  fs.writeFileSync('App.tsx', content);
  console.log('App.tsx updated');
}
