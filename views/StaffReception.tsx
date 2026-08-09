import React, { useState, useEffect } from 'react';
import { Patient, PatientStatus, Theme, Doctor } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { ReceptionSidebar } from '../components/admin/ReceptionSidebar';
import { useIntercom } from '../src/contexts/IntercomContext';
import { 
  UserPlus, Search, Phone, Activity, Camera, Banknote, 
  CreditCard, QrCode, Stethoscope, FileText, BedDouble, AlertTriangle, PlayCircle, Siren, Zap, Edit
} from 'lucide-react';

interface StaffReceptionProps {
  patients: Patient[];
  theme: Theme;
  doctors: Doctor[];
  isAdmin?: boolean;
  onEditPatient?: (patient: Patient) => void;
}

const StaffReception: React.FC<StaffReceptionProps> = ({ patients, theme, doctors, onEditPatient }) => {
  const { sendAlert } = useIntercom();
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [activeActionTab, setActiveActionTab] = useState<'opd' | 'ipd' | 'enquiry'>('opd');
  const [activeInboxTab, setActiveInboxTab] = useState<'queue' | 'missed'>('queue');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [message, setMessage] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const s = {
    bg: theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-[#1C1C1E]',
    card: theme === 'light' ? 'bg-white border-[#D2D2D7]' : 'bg-[#2C2C2E] border-[#3C3C3E]',
    text: theme === 'light' ? 'text-[#1D1D1F]' : 'text-white',
    sub: theme === 'light' ? 'text-[#86868b]' : 'text-[#98989D]',
    border: theme === 'light' ? 'border-[#D2D2D7]' : 'border-[#3C3C3E]',
    accent: theme === 'light' ? 'bg-[#007AFF] text-white' : 'bg-[#0A84FF] text-white',
    accentText: theme === 'light' ? 'text-[#007AFF]' : 'text-[#0A84FF]',
    hover: theme === 'light' ? 'hover:bg-[#E5E5EA]' : 'hover:bg-[#3A3A3C]',
  };

  // Timer effect for PA Announcement ETA
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // If the viewingPatient updates in the background (e.g. status changes), keep our local state synced
  useEffect(() => {
    if (viewingPatient) {
      const updated = patients.find(p => p.id === viewingPatient.id);
      if (updated && updated.status !== viewingPatient.status) {
        setViewingPatient(updated);
      } else if (!updated) {
        setViewingPatient(null);
      }
    }
  }, [patients]);

  // Inbox Logic
  const allWaiting = patients
    .filter(p => p.status === PatientStatus.GATE_REGISTERED || p.status === PatientStatus.RECEPTION_WAITING)
    .sort((a, b) => a.timestamp - b.timestamp);

  const inboxPatients = allWaiting
    .filter(p => p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || p.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    .slice(0, 50);

  const missedPatients = patients
    .filter(p => p.status === PatientStatus.MISSED_TURN)
    .filter(p => p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || p.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(p => {
      const missedLog = p.history?.find(h => h.stage === PatientStatus.MISSED_TURN);
      // Auto-Forfeit after 30 minutes (1800000 ms)
      if (missedLog && Date.now() - missedLog.entryTime > 1800000) {
        return false;
      }
      return true;
    })
    .slice(0, 50);

  const [isOverrideUnlocked, setIsOverrideUnlocked] = useState(false);

  const handleProcessPayment = async () => {
    if (!viewingPatient) return;
    try {
      await mockFirestore.updatePatient(viewingPatient.id, {
        status: PatientStatus.PAYMENT_DONE,
        assignedDoctorId: selectedDoctorId || undefined
      });
      
      // AUTO-FLOW: Instantly find and call the next patient!
      const next = allWaiting.find(p => p.status === PatientStatus.GATE_REGISTERED && p.id !== viewingPatient.id);
      
      if (next) {
        await mockFirestore.updatePatient(next.id, { 
          status: PatientStatus.RECEPTION_WAITING,
          lastCalledTimestamp: Date.now()
        });
        setViewingPatient({...next, status: PatientStatus.RECEPTION_WAITING});
        setCountdown(120); // 2 minute countdown
        setMessage(`Auto-called next patient: ${next.name}`);
      } else {
        setMessage('Processed successfully! Queue is empty.');
        setViewingPatient(null);
        setCountdown(0);
      }
      
      setTimeout(() => setMessage(''), 3000);
      setPaymentMethod('');
      setSelectedDoctorId('');
      setCashReceived('');
    } catch (error) {
      console.error(error);
      setMessage('Error processing patient');
    }
  };

  const handleCallNext = async () => {
    // FCFS Strict enforcement: always grab the absolute oldest GATE_REGISTERED patient
    const next = allWaiting.find(p => p.status === PatientStatus.GATE_REGISTERED);
    if (next) {
      await mockFirestore.updatePatient(next.id, { 
        status: PatientStatus.RECEPTION_WAITING,
        lastCalledTimestamp: Date.now()
      });
      setViewingPatient({...next, status: PatientStatus.RECEPTION_WAITING});
      setCountdown(120); // 2 minute countdown
      setMessage(`Called ${next.name}`);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('No patients in queue!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleMarkNoShow = async () => {
    if (!viewingPatient) return;
    await mockFirestore.updatePatient(viewingPatient.id, { status: PatientStatus.MISSED_TURN });
    setMessage(`${viewingPatient.name} moved to Penalty Box`);
    setViewingPatient(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleReinstatePatient = async () => {
    if (!viewingPatient) return;
    
    // Calculate 2nd position timestamp
    // If there is a person currently at desk, they are index 0. The next waiting is index 1.
    // If no one is at desk, index 0 is the first GATE_REGISTERED.
    const currentlyWaiting = patients
      .filter(p => p.status === PatientStatus.GATE_REGISTERED)
      .sort((a, b) => a.timestamp - b.timestamp);

    let newTimestamp = Date.now();
    if (currentlyWaiting.length >= 2) {
      // Place between 1st and 2nd waiting patient (which makes them the 2nd waiting patient)
      newTimestamp = (currentlyWaiting[0].timestamp + currentlyWaiting[1].timestamp) / 2;
    } else if (currentlyWaiting.length === 1) {
      // Only 1 waiting, place right after them
      newTimestamp = currentlyWaiting[0].timestamp + 1000;
    }

    await mockFirestore.updatePatient(viewingPatient.id, { 
      status: PatientStatus.GATE_REGISTERED,
      timestamp: newTimestamp
    });
    
    setMessage(`${viewingPatient.name} reinstated to 2nd position`);
    setActiveInboxTab('queue');
    setViewingPatient(null);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className={`h-[calc(100vh-6rem)] w-full flex gap-4 p-4 overflow-hidden ${s.bg}`}>
      
      {/* ================= COLUMN 1: INBOX (25%) ================= */}
      <div className={`w-1/4 min-w-[280px] max-w-sm rounded-3xl border shadow-xl flex flex-col overflow-hidden ${s.card}`}>
        <div className={`p-4 border-b ${s.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-black uppercase tracking-widest ${s.text}`}>Inbox</h2>
            <div className={`px-2 py-1 rounded-full text-[10px] font-black ${s.accent}`}>{allWaiting.length}</div>
          </div>

          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setActiveInboxTab('queue')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeInboxTab === 'queue' ? s.accent : `${s.bg} ${s.border} ${s.sub}`}`}
            >
              Live Queue
            </button>
            <button 
              onClick={() => setActiveInboxTab('missed')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${activeInboxTab === 'missed' ? 'bg-red-500 text-white' : `${s.bg} ${s.border} ${s.sub}`}`}
            >
              <AlertTriangle className="w-3 h-3" /> Missed ({missedPatients.length})
            </button>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${s.sub}`} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-bold outline-none border transition-all focus:ring-2 focus:ring-[#0A84FF] ${s.bg} ${s.border} ${s.text}`}
            />
          </div>
          
          <button onClick={handleCallNext} className={`w-full mt-3 py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${s.accent}`}>
            <PlayCircle className="w-4 h-4" /> Auto-Call Next
          </button>
          
          <button 
            onClick={() => {
              if (isOverrideUnlocked) {
                setIsOverrideUnlocked(false);
              } else {
                const pin = window.prompt('Enter Admin PIN (1234) for Emergency Override:');
                if (pin === '1234') {
                  setIsOverrideUnlocked(true);
                  sendAlert('Reception', 'EVERYONE', 'Everyone', '🚨 EMERGENCY BYPASS AUTHORIZED. FCFS unlocked.', 'critical');
                } else if (pin !== null) {
                  alert('Invalid PIN.');
                }
              }
            }}
            className={`w-full mt-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isOverrideUnlocked ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}
          >
            <Siren className="w-4 h-4" /> {isOverrideUnlocked ? 'LOCK OVERRIDE' : 'Emergency Bypass'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {(activeInboxTab === 'queue' ? inboxPatients : missedPatients).map(p => {
            const isAtDesk = p.status === PatientStatus.RECEPTION_WAITING;
            const isMissed = p.status === PatientStatus.MISSED_TURN;
            // ANTI-LOOPHOLE: Cannot click a patient in the live queue unless they are already at the desk!
            // SECURE OVERRIDE: If unlocked, receptionist can click anyone in the queue.
            const isClickable = isAtDesk || isMissed || isOverrideUnlocked;
            
            return (
              <div 
                key={p.id}
                onClick={() => {
                  if (isClickable) setViewingPatient(p);
                }}
                className={`p-3 rounded-2xl border transition-all ${!isClickable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'} ${viewingPatient?.id === p.id ? 'border-[#0A84FF] bg-[#0A84FF]/10' : `${s.border} ${isClickable ? s.hover : ''}`}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border ${s.bg} ${s.border}`}>
                    {p.photo ? <img src={p.photo} className="w-full h-full rounded-full object-cover" /> : <UserPlus className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-black truncate ${s.text}`}>{p.name}</div>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${s.sub}`}>
                      {isAtDesk ? (
                        <span className="text-amber-500">Currently At Desk</span>
                      ) : isMissed ? (
                        <span className="text-red-500">Missed Turn</span>
                      ) : (
                        <span>System Locked (FCFS)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= COLUMN 2: ACTION DESK (50%) ================= */}
      <div className={`flex-1 rounded-3xl border shadow-xl flex flex-col overflow-hidden ${s.card}`}>
        {message && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-2 rounded-full text-xs font-black tracking-widest shadow-2xl animate-in slide-in-from-top-4">
             {message}
           </div>
        )}
        
        {viewingPatient ? (
          <>
            {/* Header / Demographics */}
            <div className={`p-6 border-b ${s.border} ${s.bg}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${viewingPatient.status === PatientStatus.MISSED_TURN ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {viewingPatient.status === PatientStatus.MISSED_TURN ? 'Penalty Box (Missed Turn)' : 'Active at Desk'}
                </div>
                
                {/* Action Buttons based on status */}
                {viewingPatient.status === PatientStatus.RECEPTION_WAITING && (
                  <button onClick={handleMarkNoShow} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                    Mark No-Show
                  </button>
                )}
                {viewingPatient.status === PatientStatus.MISSED_TURN && (
                  <button onClick={handleReinstatePatient} className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                    Reinstate to 2nd Position
                  </button>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className={`w-24 h-24 rounded-[2rem] border-4 shadow-lg overflow-hidden shrink-0 ${theme === 'light' ? 'border-white' : 'border-[#1C1C1E]'}`}>
                  {viewingPatient.photo ? (
                    <img src={viewingPatient.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${s.card}`}><UserPlus className="w-8 h-8 opacity-20" /></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className={`text-3xl font-black tracking-tight ${s.text}`}>{viewingPatient.name}</h1>
                    <button onClick={() => onEditPatient?.(viewingPatient)} className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase flex items-center gap-1 ${s.border} ${s.hover} ${s.sub}`}>
                      <Edit className="w-3 h-3" /> Edit Master Record
                    </button>
                    <button className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase flex items-center gap-1 ${s.border} ${s.hover} ${s.sub}`}>
                      <Camera className="w-3 h-3" /> Retake Photo
                    </button>
                  </div>
                  <div className={`flex gap-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>
                    <span>ID: {viewingPatient.id}</span>
                    <span>{viewingPatient.age}Y</span>
                    <span>{viewingPatient.gender}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {viewingPatient.phone}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex gap-2">
                      <button className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 ${s.border} text-emerald-500 bg-emerald-500/10 border-emerald-500/20`}>
                        <Activity className="w-3 h-3" /> ABHA Synced
                      </button>
                      <button className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 ${s.border} text-amber-500 bg-amber-500/10 border-amber-500/20`}>
                        <FileText className="w-3 h-3" /> Aadhaar OCR Scan
                      </button>
                    </div>
                    {countdown > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#0A84FF]/20 bg-[#0A84FF]/10 text-[#0A84FF] text-[10px] font-black uppercase tracking-widest">
                        <span>PA Announcement</span>
                        <span className="tabular-nums text-[#0A84FF]">
                          0{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} ETA
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Tabs - Only if Active at Desk */}
            {viewingPatient.status === PatientStatus.RECEPTION_WAITING ? (
              <>
                <div className={`flex border-b ${s.border}`}>
                  {[
                    { id: 'opd', label: 'OPD Billing' },
                    { id: 'ipd', label: 'IPD Admission' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveActionTab(tab.id as any)}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                        activeActionTab === tab.id ? `border-b-4 border-[#0A84FF] ${s.text}` : `border-b-4 border-transparent ${s.sub} ${s.hover}`
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {activeActionTab === 'opd' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Assign Doctor */}
                        <div className="space-y-3">
                          <label className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Assign Consultant</label>
                          <div className="relative">
                            <Stethoscope className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${s.sub}`} />
                            <select 
                              value={selectedDoctorId}
                              onChange={e => setSelectedDoctorId(e.target.value)}
                              className={`w-full pl-12 pr-4 py-4 rounded-2xl font-bold border outline-none appearance-none transition-all focus:ring-2 focus:ring-[#0A84FF] ${s.bg} ${s.border} ${s.text}`}
                            >
                              <option value="">Select Doctor...</option>
                              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                            </select>
                          </div>
                          {selectedDoctorId && (
                            <button 
                              onClick={() => {
                                const docName = doctors.find(d => d.id === selectedDoctorId)?.name || 'Doctor';
                                sendAlert('Reception', selectedDoctorId || 'EVERYONE', docName, `Please be ready. Patient ${viewingPatient.name} is on the way to your cabin.`, 'info');
                                setMessage(`Pinged ${docName}`);
                                setTimeout(() => setMessage(''), 3000);
                              }}
                              className="w-full mt-2 py-3 bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0A84FF] hover:text-white transition-colors"
                            >
                              <Zap className="w-4 h-4" /> Ping Doctor
                            </button>
                          )}
                        </div>
                        {/* Fee Panel Toggle */}
                        <div className="space-y-3">
                          <label className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Panel / Rate Card</label>
                          <select className={`w-full px-4 py-4 rounded-2xl font-bold border outline-none appearance-none transition-all ${s.bg} ${s.border} ${s.text}`}>
                            <option>General Rate (₹500)</option>
                            <option>CGHS Panel (₹150)</option>
                            <option>ECHS Panel (₹150)</option>
                            <option>BPL / Ayushman (Free)</option>
                          </select>
                        </div>
                      </div>

                      {/* Payment Section */}
                      <div className="space-y-3 pt-4">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Collect Payment (₹500)</label>
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => setPaymentMethod('cash')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? `border-emerald-500 bg-emerald-500/10 text-emerald-500` : `${s.bg} ${s.border} ${s.text}`}`}>
                            <Banknote className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase">Cash</span>
                          </button>
                          <button onClick={() => setPaymentMethod('upi')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'upi' ? `border-purple-500 bg-purple-500/10 text-purple-500` : `${s.bg} ${s.border} ${s.text}`}`}>
                            <QrCode className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase">Dynamic UPI</span>
                          </button>
                          <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? `border-blue-500 bg-blue-500/10 text-blue-500` : `${s.bg} ${s.border} ${s.text}`}`}>
                            <CreditCard className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase">Card / POS</span>
                          </button>
                        </div>
                      </div>

                      {/* Cash Calculator Popout */}
                      {paymentMethod === 'cash' && (
                        <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-top-2 ${s.card} ${s.border}`}>
                          <div className="space-y-1">
                            <div className={`text-[9px] font-black uppercase tracking-widest ${s.sub}`}>Cash Denomination Calc</div>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${s.text}`}>₹</span>
                              <input 
                                type="number" 
                                placeholder="Amount Received" 
                                value={cashReceived}
                                onChange={e => setCashReceived(e.target.value)}
                                className={`w-32 bg-transparent outline-none text-xl font-black ${s.text}`} 
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[9px] font-black uppercase tracking-widest ${s.sub}`}>Change to return</div>
                            <div className={`text-2xl font-black ${Number(cashReceived) - 500 > 0 ? 'text-emerald-500' : s.sub}`}>
                              ₹{Math.max(0, Number(cashReceived) - 500)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dynamic UPI Mock */}
                      {paymentMethod === 'upi' && (
                        <div className={`p-4 rounded-2xl border flex items-center gap-6 animate-in slide-in-from-top-2 ${s.card} ${s.border}`}>
                          <div className="w-24 h-24 bg-white p-2 rounded-xl border-2 border-purple-500 flex items-center justify-center">
                            <QrCode className="w-full h-full text-purple-900" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-black text-purple-500`}>Scan to Pay ₹500</h4>
                            <p className={`text-xs font-bold ${s.sub}`}>QR code is dynamically linked to {viewingPatient.name}'s token. Waiting for payment...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActionTab === 'ipd' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className={`p-6 rounded-3xl border flex items-center gap-4 ${s.card} ${s.border}`}>
                        <BedDouble className={`w-8 h-8 ${s.accentText}`} />
                        <div>
                          <h3 className={`text-sm font-black uppercase tracking-widest ${s.text}`}>Admit to IPD</h3>
                          <p className={`text-[10px] font-bold ${s.sub}`}>Select a ward and collect the ₹50,000 advance deposit.</p>
                        </div>
                      </div>
                      {/* Mock Bed Selector */}
                      <select className={`w-full px-4 py-4 rounded-2xl font-bold border outline-none appearance-none transition-all ${s.bg} ${s.border} ${s.text}`}>
                        <option>Select Bed / Ward...</option>
                        <option>General Ward - Bed 14 (Available)</option>
                        <option>General Ward - Bed 15 (Available)</option>
                        <option>Private Room 204 (Available)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Bottom Sticky Action Bar */}
                <div className={`p-4 border-t ${s.border} ${s.bg}`}>
                  <button 
                    onClick={handleProcessPayment}
                    className={`w-full py-5 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] sm:text-xs shadow-xl active:scale-95 ${s.accent}`}
                  >
                    COMPLETE & PRINT SLIP
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                <AlertTriangle className={`w-20 h-20 mb-6 text-red-500`} />
                <h2 className={`text-2xl font-black mb-2 ${s.text}`}>Patient Not Present</h2>
                <p className={`text-sm font-bold max-w-sm ${s.sub}`}>This patient missed their turn. Click the Reinstate button above to put them back into the 2nd position of the queue.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
            <PlayCircle className={`w-20 h-20 mb-6 ${s.sub}`} />
            <h2 className={`text-2xl font-black mb-2 ${s.text}`}>Ready for Next Patient</h2>
            <p className={`text-sm font-bold max-w-sm ${s.sub}`}>System is locked to strict First-Come-First-Serve mode. Click "Auto-Call Next" in the inbox to process the oldest token.</p>
          </div>
        )}
      </div>

      {/* ================= COLUMN 3: SIDEBAR DASHBOARD (25%) ================= */}
      <div className={`w-1/4 min-w-[280px] max-w-sm rounded-3xl overflow-hidden`}>
        <ReceptionSidebar patients={patients} doctors={doctors} theme={theme} />
      </div>

    </div>
  );
};

export default StaffReception;
