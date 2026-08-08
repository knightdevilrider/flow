const fs = require('fs');
let code = fs.readFileSync('views/StaffReception.tsx', 'utf8');

// The block we want to replace
const blockToFix =                   <button 
                    onClick={handleProcessPayment} 
                    className={\w-full py-4 sm:py-5 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] sm:text-xs shadow-xl active:scale-95 \\}
                  >
                    COMPLETE & CALL NEXT
                  </button>
                </div>
              </div>
            </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 sm:py-20 text-center">
              <button 
                onClick={handleCallNext};

const fixedBlock =                   <button 
                    onClick={handleProcessPayment} 
                    className={\w-full py-4 sm:py-5 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] sm:text-xs shadow-xl active:scale-95 \\}
                  >
                    COMPLETE & CALL NEXT
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 sm:py-20 text-center">
              <button 
                onClick={handleCallNext};

code = code.replace(blockToFix, fixedBlock);

fs.writeFileSync('views/StaffReception.tsx', code);
console.log('Fixed StaffReception JSX');
