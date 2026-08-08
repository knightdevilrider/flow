const fs = require('fs');
const file = 'views/StaffReception.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // 1. Add Check import
  if (!code.includes('import { Check }')) {
    code = code.replace(/import React, \{ useState \} from 'react';/, 'import React, { useState } from \'react\';\nimport { Check } from \'lucide-react\';');
  }

  // 2. Remove the photo div
  // The div starts with <div\nonClick={() => setViewingPatient(currentPatient)}\nclassName=...w-32 h-32...
  // and ends with </div> right before <div className=\"flex-1 w-full space-y-4\">
  const photoDivRegex = /<div\s*onClick=\{\(\) => setViewingPatient\(currentPatient\)\}[\s\S]*?<\/div>[\s]*<div className="flex-1 w-full space-y-4">/;
  code = code.replace(photoDivRegex, '<div className="flex-1 w-full space-y-4">');
  
  // 3. Add the checkbox above the button
  const checkboxCode = `
                  <div className="pt-4">
                    <label className="flex items-center gap-3 cursor-pointer group mb-6">
                      <div className={\`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors \${currentPatient.allowPhotoOnDisplay ? 'bg-[#007AFF] border-[#007AFF]' : 'border-[#333] group-hover:border-[#007AFF]'}\`}>
                        {currentPatient.allowPhotoOnDisplay && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={currentPatient.allowPhotoOnDisplay || false} 
                        onChange={(e) => updateCurrentPatient({ allowPhotoOnDisplay: e.target.checked })} 
                      />
                      <span className={\`text-sm font-bold opacity-80 \${s.text}\`}>
                        Allow Photo on Public Display (helps patients recognize their turn)
                      </span>
                    </label>
                  </div>
`;
  
  const buttonRegex = /<button[\s]*onClick=\{handleProcessPayment\}/;
  code = code.replace(buttonRegex, checkboxCode + '<button\n                    onClick={handleProcessPayment}');
  
  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed StaffReception');
} else {
  console.log('File not found');
}
