import React, { useState } from 'react';

interface FollowUpSchedulerProps {
  themeStyles: any;
}

const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({ themeStyles: s }) => {
  const [followUpDays, setFollowUpDays] = useState('7');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const handleSchedule = () => {
    setIsScheduled(true);
    setTimeout(() => setIsScheduled(false), 3000);
  };

  return (
    <div className={`p-4 rounded-2xl border shadow-sm ${s.card}`}>
      <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${s.header}`}>Follow-Up Schedule</h4>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          {['3', '5', '7', '14', '30'].map(days => (
            <button
              key={days}
              onClick={() => setFollowUpDays(days)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                followUpDays === days 
                  ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-md' 
                  : `hover:bg-black/5 dark:hover:bg-white/5 ${s.sub}`
              }`}
            >
              {days}d
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center px-2">
          <label className={`flex items-center gap-2 text-[10px] font-bold cursor-pointer ${s.header}`}>
            <input 
              type="checkbox" 
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-3 h-3 accent-emerald-500"
            />
            WhatsApp Reminder
          </label>
          <label className={`flex items-center gap-2 text-[10px] font-bold cursor-pointer ${s.header}`}>
            <input 
              type="checkbox" 
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
              className="w-3 h-3 accent-blue-500"
            />
            SMS Alert
          </label>
        </div>

        <button
          onClick={handleSchedule}
          className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isScheduled 
              ? 'bg-emerald-500 text-white' 
              : `bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ${s.header}`
          }`}
        >
          {isScheduled ? '✓ Scheduled' : 'Set Follow-up'}
        </button>
      </div>
    </div>
  );
};

export default FollowUpScheduler;
