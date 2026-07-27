import React from 'react';
import { Theme } from '../../types';

interface SmartLabResultsProps {
  themeStyles: any;
  theme: Theme;
}

// Mock lab data
const MOCK_LAB_RESULTS = [
  { test: 'Hemoglobin (Hb)', value: 11.2, unit: 'g/dL', normalRange: '13.5 - 17.5', isAbnormal: true },
  { test: 'Total WBC Count', value: 8500, unit: '/cumm', normalRange: '4000 - 11000', isAbnormal: false },
  { test: 'Fasting Blood Sugar', value: 145, unit: 'mg/dL', normalRange: '70 - 100', isAbnormal: true },
  { test: 'Serum Creatinine', value: 0.9, unit: 'mg/dL', normalRange: '0.6 - 1.2', isAbnormal: false },
  { test: 'TSH', value: 3.2, unit: 'uIU/mL', normalRange: '0.4 - 4.0', isAbnormal: false },
];

const SmartLabResults: React.FC<SmartLabResultsProps> = ({ themeStyles: s, theme }) => {
  return (
    <div className={`p-4 rounded-2xl border shadow-sm ${s.card}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className={`text-xs font-black uppercase tracking-widest ${s.header}`}>Latest Lab Results</h4>
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 ${s.sub}`}>
          Yesterday, 09:30 AM
        </span>
      </div>

      <div className="space-y-2">
        {MOCK_LAB_RESULTS.map((lab, index) => (
          <div key={index} className={`flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-colors ${lab.isAbnormal ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}>
            <div>
              <div className={`text-[10px] font-bold ${lab.isAbnormal ? 'text-red-600 dark:text-red-400' : s.header}`}>
                {lab.test}
              </div>
              <div className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>
                Normal: {lab.normalRange} {lab.unit}
              </div>
            </div>
            
            <div className={`text-right ${lab.isAbnormal ? 'text-red-600 dark:text-red-400' : ''}`}>
              <span className="text-xs font-black">{lab.value}</span>
              <span className="text-[8px] font-bold ml-1 opacity-60">{lab.unit}</span>
              {lab.isAbnormal && (
                <span className="ml-2 text-red-500 animate-pulse">↑</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button className={`w-full mt-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all hover:bg-black/5 dark:hover:bg-white/5 ${s.btn}`}>
        View Full Report
      </button>
    </div>
  );
};

export default SmartLabResults;
