
import React, { useState } from 'react';
import { Patient, PatientStatus, PatientCategory } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffGateProps {
  patients: Patient[];
}

const StaffGate: React.FC<StaffGateProps> = ({ patients }) => {
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    category: PatientCategory.OPD,
    name: '',
    phone: '',
    idType: 'Aadhaar Card',
    idNumber: '',
    age: '',
    gender: 'Male',
    address: '',
    photo: '',
    insuranceType: 'Cash/Self-Pay',
    isForeigner: false,
    medicalHistory: '',
    targetPatientId: '',
    relationship: '',
    emergencyContact: ''
  });

  // Dynamically calculate waiting patients from current live state
  const waitingCount = patients.filter(p => p.status !== PatientStatus.COMPLETED).length;

  const categories = [
    { id: PatientCategory.OPD, icon: '🩺', desc: 'Check-ups, Tests, Advice', color: 'blue' },
    { id: PatientCategory.IPD, icon: '🛌', desc: 'Surgery or Serious Care', color: 'indigo' },
    { id: PatientCategory.VISITOR, icon: '👥', desc: 'Friends & Family', color: 'purple' },
    { id: PatientCategory.ATTENDANT, icon: '🤝', desc: 'Overnight Caretakers', color: 'pink' },
    { id: PatientCategory.EMERGENCY, icon: '🚑', desc: 'Immediate Life-Saving', color: 'red' },
  ];

  const admittedPatients = patients.filter(p => p.category === PatientCategory.IPD && p.status !== PatientStatus.COMPLETED);

  const handleCategorySelect = (cat: PatientCategory) => {
    setFormData({ ...formData, category: cat });
    setError('');
    setStep('form');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await mockFirestore.addPatient({
        name: formData.name,
        contactNumber: formData.phone,
        status: PatientStatus.GATE_REGISTERED,
        category: formData.category,
        idType: formData.idType,
        idNumber: formData.idNumber,
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        photo: formData.photo,
        insuranceType: formData.insuranceType,
        isForeigner: formData.isForeigner,
        medicalHistory: formData.medicalHistory,
        targetPatientId: formData.targetPatientId,
        relationship: formData.relationship,
        emergencyContact: formData.emergencyContact,
        expiryTimestamp: formData.category === PatientCategory.VISITOR ? Date.now() + (2 * 60 * 60 * 1000) : undefined
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep('selection');
        setFormData({
          category: PatientCategory.OPD,
          name: '',
          phone: '',
          idType: 'Aadhaar Card',
          idNumber: '',
          age: '',
          gender: 'Male',
          address: '',
          photo: '',
          insuranceType: 'Cash/Self-Pay',
          isForeigner: false,
          medicalHistory: '',
          targetPatientId: '',
          relationship: '',
          emergencyContact: ''
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to register patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'selection') {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center py-6 px-4 bg-[#0a1121]">
        {/* Header Bar */}
        <div className="w-full max-w-[1400px] flex justify-between items-center mb-16">
          <button className="w-12 h-12 flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase opacity-90">Gate Registration Terminal</h2>
          <div className="flex items-center gap-2">
             <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest mr-2">Hospital</span>
             <span className="text-xl font-black text-white uppercase tracking-tighter">Total Patients Waiting: <span className="text-emerald-400">{waitingCount}</span></span>
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ml-1"></div>
          </div>
        </div>

        {/* Title Group */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">Registration Intake</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">Please select the primary reason for this visit to begin registration.</p>
        </div>

        {/* Main Selection Grid (3+2) */}
        <div className="w-full max-w-[1200px] space-y-8 pb-12">
          {/* Row 1: 3 Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="group relative flex flex-col p-10 bg-[#161f30]/40 border-2 border-slate-800/40 rounded-[2.5rem] text-left transition-all duration-300 hover:border-blue-500/60 hover:bg-[#161f30] hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)] min-h-[340px]"
              >
                {/* Max-sized icons for staff efficiency */}
                <div className="w-24 h-24 bg-[#1e293b] rounded-3xl flex items-center justify-center text-7xl mb-12 group-hover:scale-110 transition-transform duration-500 shadow-2xl border-2 border-slate-700/50">
                  {cat.icon}
                </div>
                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight leading-tight">{cat.id}</h3>
                <p className="text-slate-400 font-bold text-base leading-relaxed max-w-[240px] opacity-80">{cat.desc}</p>
                <div className="absolute bottom-10 right-10 text-blue-500 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </button>
            ))}
          </div>

          {/* Row 2: 2 Items Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto">
            {categories.slice(3, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="group relative flex flex-col p-10 bg-[#161f30]/40 border-2 border-slate-800/40 rounded-[2.5rem] text-left transition-all duration-300 hover:border-blue-500/60 hover:bg-[#161f30] hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)] min-h-[340px]"
              >
                {/* Max-sized icons for staff efficiency */}
                <div className="w-24 h-24 bg-[#1e293b] rounded-3xl flex items-center justify-center text-7xl mb-12 group-hover:scale-110 transition-transform duration-500 shadow-2xl border-2 border-slate-700/50">
                  {cat.icon}
                </div>
                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight leading-tight">{cat.id}</h3>
                <p className="text-slate-400 font-bold text-base leading-relaxed max-w-[240px] opacity-80">{cat.desc}</p>
                <div className="absolute bottom-10 right-10 text-blue-500 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Simple Footer */}
        <div className="w-full text-center py-10 border-t border-slate-800/30 mt-auto">
          <p className="text-[10px] font-black text-slate-700 tracking-[0.5em] uppercase">© 2024 Hospital Patient Flow Solutions • System Active</p>
        </div>
      </div>
    );
  }

  const isVisitorOrAttendant = formData.category === PatientCategory.VISITOR || formData.category === PatientCategory.ATTENDANT;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 bg-[#0a1121] min-h-screen">
      {/* Form Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setStep('selection')} className="px-5 py-2.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-black transition-all border border-slate-800 flex items-center gap-2">
          <span>←</span> Change Category
        </button>
        <div className="px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Intake: {formData.category.toUpperCase()}
        </div>
      </div>

      <div className="glass p-12 rounded-[3.5rem] border border-slate-800/60 shadow-2xl relative overflow-hidden bg-[#111827]/40">
        {success && (
          <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center animate-in fade-in">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 border-2 border-emerald-500/40 animate-bounce">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Registration Success</h3>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-16">
          {error && <div className="p-8 bg-red-500/5 border-2 border-red-500/20 rounded-[2.5rem] text-red-400 font-bold text-sm leading-relaxed text-center">{error}</div>}
          
          {/* Section 01: Linked Patient */}
          {isVisitorOrAttendant && (
            <section className="animate-in slide-in-from-top-4">
              <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> 01 Linked Admitted Patient
              </h4>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Select Admitted Patient (IPD)</label>
                <select 
                  required
                  value={formData.targetPatientId}
                  onChange={(e) => setFormData({ ...formData, targetPatientId: e.target.value })}
                  className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 text-lg appearance-none"
                >
                  <option value="">Select Patient...</option>
                  {admittedPatients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
                </select>
              </div>
            </section>
          )}

          {/* Section: Identity Proof */}
          <section>
            <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> 
              {isVisitorOrAttendant ? '02' : '01'} Identity Proof
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">ID Document Type</label>
                <select 
                  value={formData.idType}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 text-lg appearance-none"
                >
                  <option>Aadhaar Card</option>
                  <option>Driving License</option>
                  <option>Passport</option>
                  <option>Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Document Number</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter ID Number..."
                  value={formData.idNumber} 
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} 
                  className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
                />
              </div>
            </div>
          </section>

          {/* Section: Profile Details */}
          <section>
            <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> 
              {isVisitorOrAttendant ? '03' : '02'} Profile Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div className="md:col-span-7 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Full Legal Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter name as per ID..."
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Mobile Number</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Age</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="Enter age..."
                      value={formData.age} 
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
                      className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
                    />
                  </div>
                </div>
                
                {isVisitorOrAttendant && (
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Relationship</label>
                      <select 
                        required
                        value={formData.relationship}
                        onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                        className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none appearance-none text-lg"
                      >
                        <option value="">Select...</option>
                        <option>Spouse</option>
                        <option>Parent</option>
                        <option>Sibling</option>
                        <option>Child</option>
                        <option>Relative</option>
                        <option>Friend</option>
                      </select>
                   </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Medical Note / Brief Complaint</label>
                  <textarea 
                    placeholder="Enter any medical history or current complaint..."
                    value={formData.medicalHistory} 
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })} 
                    rows={4}
                    className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none" 
                  />
                </div>
              </div>
              <div className="md:col-span-5 flex flex-col items-center">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Photo {formData.category === PatientCategory.ATTENDANT && '(Mandatory)'}</label>
                <div className="w-full max-w-[320px] aspect-square bg-[#0b1121] rounded-[2.5rem] border-2 border-dashed border-slate-800/60 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner transition-colors hover:border-blue-500/40">
                  {formData.photo ? (
                    <img src={formData.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 opacity-30 group-hover:opacity-60 transition-opacity">
                      <span className="text-6xl block mb-4">📸</span>
                      <p className="text-[10px] font-black uppercase tracking-widest max-w-[140px] mx-auto">Click to Capture Profile Photo</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" required={formData.category === PatientCategory.ATTENDANT} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Contact & Financials (for patients) */}
          {(formData.category === PatientCategory.OPD || formData.category === PatientCategory.IPD || formData.category === PatientCategory.EMERGENCY) && (
            <section className="animate-in slide-in-from-top-4">
              <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4"><span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> 03 Contact & Financials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Alternative Mobile Number</label>
                  <input 
                    type="tel" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none text-lg" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Insurance / Scheme</label>
                  <select 
                    value={formData.insuranceType}
                    onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value })}
                    className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none text-lg appearance-none"
                  >
                    <option>Cash/Self-Pay</option>
                    <option>Corporate Insurance</option>
                    <option>Govt Scheme (Ayushman Bharat)</option>
                    <option>TPA / CGHS</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Section: Secondary Contact (for Attendants) */}
          {formData.category === PatientCategory.ATTENDANT && (
            <section className="animate-in slide-in-from-top-4">
              <h4 className="text-[11px] font-black text-pink-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4"><span className="w-1.5 h-6 bg-pink-500 rounded-full"></span> 04 Emergency Contact (Secondary)</h4>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Alternative Phone</label>
                <input 
                  type="tel" 
                  placeholder="Secondary mobile number..." 
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  className="w-full bg-[#0b1121] border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none text-lg" 
                />
              </div>
            </section>
          )}

          <div className="pt-8">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-7 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-3xl shadow-[0_20px_50px_rgba(59,130,246,0.25)] transition-all uppercase tracking-[0.4em] disabled:opacity-50 text-base"
            >
              {isSubmitting ? 'Syncing...' : 
               formData.category === PatientCategory.VISITOR ? 'Issue Temporary Pass' :
               formData.category === PatientCategory.ATTENDANT ? 'Activate Attendant ID' :
               'Register Patient'}
            </button>
          </div>
        </form>
      </div>
      <div className="text-center mt-12 text-[10px] font-black text-slate-700 tracking-[0.5em] uppercase">© 2024 Hospital Patient Flow Solutions • System Active</div>
    </div>
  );
};

export default StaffGate;
