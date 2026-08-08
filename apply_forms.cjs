const fs = require('fs');

function updateStaffForm(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Update initial formData state
  if (code.includes('publicDisplayConsent')) return; // Already updated

  code = code.replace(
    /idNumber:\s*'',/g,
    'idNumber: \'\',\n      publicDisplayConsent: true,\n      photoUrl: \'\','
  );

  // 2. Update firestore call
  code = code.replace(
    /idNumber:\s*formData\.idNumber,/g,
    'idNumber: formData.idNumber,\n          publicDisplayConsent: formData.publicDisplayConsent,\n          photoUrl: formData.photoUrl,'
  );

  // 3. Add UI elements for the photo feature right before the submit button
  // Find where the submit button is. It's usually inside a form.
  // Wait, the button usually has type=\"submit\"
  const photoUI = `
          {/* Patient Photo Section */}
          <div className={\`p-4 rounded-[1rem] border-2 \${s.card} space-y-4 mb-4\`}>
            <h3 className={\`text-xs font-black uppercase tracking-widest opacity-60 \${s.sub}\`}>Public Display Preferences</h3>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.publicDisplayConsent}
                onChange={(e) => setFormData({ ...formData, publicDisplayConsent: e.target.checked })}
                className="w-5 h-5 rounded-md border-2 accent-[#007AFF] bg-transparent" 
              />
              <span className={\`text-sm font-bold \${s.text} group-hover:opacity-80 transition-opacity\`}>
                Allow Photo on Public Display (helps patients recognize their turn)
              </span>
            </label>

            {formData.publicDisplayConsent && (
              <div className="flex items-center gap-4 mt-2">
                {formData.photoUrl ? (
                  <div className="relative">
                    <img src={formData.photoUrl} alt="Patient" className="w-16 h-16 rounded-full object-cover border-4 border-[#007AFF]" />
                    <button type="button" onClick={() => setFormData({ ...formData, photoUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg text-[10px] w-5 h-5 flex items-center justify-center font-bold">X</button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => {
                      // Generate a dummy photo for testing
                      const randomId = Math.floor(Math.random() * 1000);
                      setFormData({ ...formData, photoUrl: \`https://i.pravatar.cc/150?u=\${randomId}\` });
                    }}
                    className="px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] font-bold uppercase tracking-widest text-xs rounded-xl border border-[#007AFF]/30 hover:bg-[#007AFF]/20 transition-colors"
                  >
                    📸 Capture Photo
                  </button>
                )}
              </div>
            )}
          </div>
  `;
  
  // Insert before the submit button wrapper which usually has "className=\"mt-8\"" or something, 
  // or just before the closing </form> tag.
  // Let's replace </form> with photoUI + </form>
  code = code.replace(/<\/form>/g, photoUI + '\n          </form>');

  fs.writeFileSync(filePath, code, 'utf8');
}

updateStaffForm('views/StaffGate.tsx');
try {
  updateStaffForm('views/StaffReception.tsx');
} catch (e) {
  console.log('Skipped Reception if not exact match or doesnt exist');
}

console.log('Staff Gate and Reception updated successfully!');
