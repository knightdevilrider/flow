
import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MapPin, Activity, Calendar, Hash, Stethoscope, BedDouble } from 'lucide-react';
import { Patient, Theme, PatientCategory, PatientStatus, Doctor } from '../../types';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  initialData: Patient | null;
  theme: Theme;
  doctors: Doctor[];
}

const PatientFormModal: React.FC<PatientFormModalProps> = ({ isOpen, onClose, onSave, initialData, theme, doctors }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    age: '',
    gender: 'Male',
    contactNumber: '',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    category: PatientCategory.OPD,
    status: PatientStatus.GATE_REGISTERED,
    assignedDoctorId: '',
    allocatedBedNumber: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        contactNumber: '',
        address: '',
        emergencyContact: '',
        bloodGroup: '',
        allergies: '',
        chronicConditions: '',
        currentMedications: '',
        category: PatientCategory.OPD,
        status: PatientStatus.GATE_REGISTERED,
        assignedDoctorId: '',
        allocatedBedNumber: '',
        timestamp: Date.now()
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const themeStyles = {
    dark: {
      bg: 'bg-black/80',
      card: 'bg-[#141417] border-white/10',
      text: 'text-white',
      sub: 'text-[#8E8E93]',
      input: 'bg-[#1C1C1E] border-white/10 text-white focus:border-blue-500',
      label: 'text-[#8E8E93]'
    },
    light: {
      bg: 'bg-black/40',
      card: 'bg-white border-black/5',
      text: 'text-black',
      sub: 'text-[#636366]',
      input: 'bg-black/5 border-black/10 focus:border-blue-600',
      label: 'text-[#636366]'
    },
    titanium: {
      bg: 'bg-black/80',
      card: 'bg-[#4D4D4D] border-white/10',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      input: 'bg-black/20 border-white/10 text-[#E8E8ED] focus:border-blue-500',
      label: 'text-[#A1A1A6]'
    }
  };

  const s = themeStyles[theme];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md ${s.bg}`}>
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border shadow-2xl p-6 sm:p-10 ${s.card}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter ${s.text}`}>
              {initialData ? 'Edit Patient Record' : 'Register New Patient'}
            </h2>
            <p className={`text-xs font-bold uppercase tracking-widest opacity-50 ${s.sub}`}>
              {initialData ? `Record ID: ${initialData.id}` : 'Electronic Medical Record Initialization'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
            <X className={`w-6 h-6 ${s.text}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Personal Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <User className="w-4 h-4 text-blue-500" />
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.text}`}>Personal Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="text" required placeholder="John Doe"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Age</label>
                  <input
                    type="text" required placeholder="25"
                    value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Gender</label>
                  <select
                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="tel" required placeholder="+91 9876543210"
                    value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Emergency Contact</label>
                <input
                  type="text" placeholder="Guardian Name / Phone"
                  value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 opacity-40" />
                <textarea
                  placeholder="Street, City, Zip Code"
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold min-h-[100px] ${s.input}`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Medical Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Activity className="w-4 h-4 text-red-500" />
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.text}`}>Medical History & Vitals</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Blood Group</label>
                <select
                  value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                >
                  <option value="">Unknown</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Known Allergies</label>
                <input
                  type="text" placeholder="Penicillin, Peanuts, etc."
                  value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Chronic Conditions</label>
                <input
                  type="text" placeholder="Diabetes, Hypertension, etc."
                  value={formData.chronicConditions} onChange={e => setFormData({...formData, chronicConditions: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Current Medications</label>
                <input
                  type="text" placeholder="Metformin, Lisinopril, etc."
                  value={formData.currentMedications} onChange={e => setFormData({...formData, currentMedications: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Admission Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.text}`}>Visit & Admission Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Admission Type</label>
                <select
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as PatientCategory})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                >
                  {Object.values(PatientCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Current Status</label>
                <select
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PatientStatus})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                >
                  {Object.values(PatientStatus).map(stat => <option key={stat} value={stat}>{stat.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Assigned Consultant</label>
                <div className="relative">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <select
                    value={formData.assignedDoctorId} onChange={e => setFormData({...formData, assignedDoctorId: e.target.value})}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  >
                    <option value="">No Doctor Assigned</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Assigned Room / Bed</label>
                <div className="relative">
                  <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="text" placeholder="Ward A - Bed 12"
                    value={formData.allocatedBedNumber} onChange={e => setFormData({...formData, allocatedBedNumber: e.target.value})}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Patient ID (Reference)</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="text" disabled placeholder="System Generated"
                    value={formData.id || ''}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold opacity-50 ${s.input}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest transition-all border ${s.text} border-current opacity-40 hover:opacity-100`}
            >
              Discard Changes
            </button>
            <button
              type="submit"
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
            >
              <div className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                {initialData ? 'Update Master Record' : 'Create Patient Record'}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;
