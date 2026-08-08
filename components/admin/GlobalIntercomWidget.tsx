import React, { useState, useEffect, useRef } from 'react';
import { useIntercom } from '../../src/contexts/IntercomContext';
import { MessageSquare, X, Send, User } from 'lucide-react';
import { Theme } from '../../types';

interface GlobalIntercomWidgetProps {
  theme: Theme;
  currentRole: string;
}

export const GlobalIntercomWidget: React.FC<GlobalIntercomWidgetProps> = ({ theme, currentRole }) => {
  const { alerts, sendAlert } = useIntercom();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [alerts, isOpen]);

  const isDark = theme === 'dark' || theme === 'titanium';
  const roleName = currentRole || 'Staff';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendAlert(roleName, message.trim(), 'info');
    setMessage('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
      {isOpen ? (
        <div className={`w-80 h-96 flex flex-col rounded-3xl shadow-2xl mb-4 overflow-hidden border transition-all duration-300 ${isDark ? 'bg-[#1C1C1E] border-[#3C3C3E] text-white' : 'bg-white border-[#D2D2D7] text-black'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-inherit">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0A84FF]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Internal Intercom</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className={`text-center text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'} mt-10`}>
                No messages yet.
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="flex flex-col gap-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/50'} pl-1`}>
                    {alert.sender}
                  </span>
                  <div className={`text-xs px-3 py-2 rounded-2xl w-fit max-w-[90%] font-medium ${alert.sender === roleName ? 'bg-[#0A84FF] text-white self-end rounded-br-sm' : isDark ? 'bg-[#2C2C2E] text-white rounded-bl-sm' : 'bg-black/5 text-black rounded-bl-sm'}`}>
                    {alert.message}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-inherit">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type message..."
                className={`w-full pl-4 pr-10 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${isDark ? 'bg-[#2C2C2E] border-[#3C3C3E] focus:border-[#0A84FF] text-white placeholder-white/40' : 'bg-black/5 border-transparent focus:border-[#0A84FF] text-black placeholder-black/40'}`}
              />
              <button 
                type="submit" 
                disabled={!message.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${!message.trim() ? 'opacity-50' : 'hover:bg-[#0A84FF]/10 text-[#0A84FF]'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#0A84FF] hover:bg-[#0071e3] text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0A84FF]"></span>
            )}
          </div>
        </button>
      )}
    </div>
  );
};
