const fs = require('fs');
const file = 'views/StaffReception.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // 1. Add Pencil import
  if (!code.includes('Pencil')) {
    code = code.replace(/Check \} from 'lucide-react'/, 'Check, Pencil } from \'lucide-react\'');
  }

  // 2. Add Edit button
  const oldDiv = /<div onClick=\{\(\) => setViewingPatient\(currentPatient\)\} className="cursor-pointer group">\s*<h3[\s\S]*?<\/p>\s*<\/div>/;
  
  const newDiv = `
                <div className="flex items-center justify-between w-full">
                  <div onClick={() => setViewingPatient(currentPatient)} className="cursor-pointer group">
                    <h3 className={\`text-3xl sm:text-4xl font-black tracking-tight leading-tight \${s.header} group-hover:\${s.accent} transition-colors\`}>{currentPatient.name}</h3>
                    <p className={\`text-[9px] font-black uppercase tracking-[0.2em] mt-1 \${s.sub}\`}>ID: {currentPatient.id} • {currentPatient.age}Y • {currentPatient.gender}</p>
                  </div>
                  {onEditPatient && (
                    <button 
                      onClick={() => onEditPatient(currentPatient)}
                      className={\`p-3 rounded-xl transition-colors shadow-sm active:scale-95 \${theme === 'light' ? 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#0071e3]' : 'bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#0A84FF]'}\`}
                      title="Edit Patient Info"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>
  `;
  
  code = code.replace(oldDiv, newDiv);
  
  fs.writeFileSync(file, code, 'utf8');
  console.log('Added Edit button');
} else {
  console.log('File not found');
}
