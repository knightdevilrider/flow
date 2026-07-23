import React, { useState, useEffect } from 'react';
import { X, Save, Stethoscope, MapPin, Clock, Phone, Mail, DollarSign, UserCheck } from 'lucide-react';
import { Doctor, Theme, Section } from '../../types';

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doctor: Partial<Doctor>) => void;
  initialData?: Doctor | null;
  theme: Theme;
}

const DoctorFormModal: React.FC<DoctorFormModalProps> = ({ isOpen, onClose, onSave, initialData, theme }) => {
  const [formData, setFormData] = useState<Partial<Doctor>>({
    name: '',
    specialty: '',
    subSpecialization: '',
    licenseNumber: '',
    qualification: '',
    roomId: '',
    opdFloor: '',
    associatedWard: '',
    consultationDays: [],
    workingHours: '',
    avgConsultationTime: 15,
    status: 'Active',
    extension: '',
    email: '',
    phone: '',
    consultationFee: 0,
    assistantTag: '',
    section: 'A',
    maxCapacity: 50,
    estWaitPerPatient: 15
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        specialty: '',
        subSpecialization: '',
        licenseNumber: '',
        qualification: '',
        roomId: '',
        opdFloor: '',
        associatedWard: '',
        consultationDays: [],
        workingHours: '',
        avgConsultationTime: 15,
        status: 'Active',
        extension: '',
        email: '',
        phone: '',
        consultationFee: 0,
        assistantTag: '',
        section: 'A',
        maxCapacity: 50,
        estWaitPerPatient: 15
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleDay = (day: string) => {
    const current = formData.consultationDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, consultationDays: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, consultationDays: [...current, day] });
    }
  };

  const s = theme === 'dark' || theme === 'titanium' ? {
    overlay: 'bg-black/60 backdrop-blur-sm',
    content: 'bg-[#141417] border-white/10 text-white',
    input: 'bg-[#1C1C1E] border-white/10 text-white focus:border-blue-500',
    section: 'bg-white/5 border-white/5',
    label: 'text-[#8E8E93]',
    text: 'text-white'
  } : {
    overlay: 'bg-black/20 backdrop-blur-sm',
    content: 'bg-white border-black/5 text-black',
    input: 'bg-white border-black/10 text-black focus:border-blue-600',
    section: 'bg-black/5 border-black/5',
    label: 'text-[#636366]',
    text: 'text-black'
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 ${s.overlay}`}>
      <div className={`w-full max-w-4xl max-h-full overflow-y-auto rounded-[2.5rem] border shadow-2xl ${s.content}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-8 border-b border-white/5 bg-inherit">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {initialData ? 'Edit Doctor Profile' : 'Register New Doctor'}
            </h2>
            <p className={`text-xs font-medium opacity-50 mt-1 uppercase tracking-widest`}>
              {initialData ? `Updating records for ID: ${initialData.id}` : 'Create a comprehensive medical profile'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Professional Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Stethoscope className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-black uppercase tracking-widest">Professional Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Full Name (MD/Dr.)</label>
                <input
                  type="text" required placeholder="e.g. Dr. Jane Doe, MD"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Specialization</label>
                <input
                  type="text" required placeholder="e.g. Cardiology"
                  value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Sub-Specialization / Department</label>
                <input
                  type="text" placeholder="e.g. Interventional Cardiology"
                  value={formData.subSpecialization} onChange={e => setFormData({...formData, subSpecialization: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>License / Reg No.</label>
                  <input
                    type="text" required placeholder="Medical Reg ID"
                    value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Qualification</label>
                  <input
                    type="text" placeholder="e.g. MBBS, DM"
                    value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Facility & Allocation */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black uppercase tracking-widest">Facility & Allocation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Room / Cabin Number</label>
                <input
                  type="text" placeholder="e.g. Room 302"
                  value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>OPD Floor / Wing</label>
                <input
                  type="text" placeholder="e.g. 2nd Floor, East"
                  value={formData.opdFloor} onChange={e => setFormData({...formData, opdFloor: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Nursing Station / Ward</label>
                <input
                  type="text" placeholder="e.g. Ward A-2"
                  value={formData.associatedWard} onChange={e => setFormData({...formData, associatedWard: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Admin Section</label>
                <select
                  value={formData.section}
                  onChange={e => setFormData({...formData, section: e.target.value as Section})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                >
                  <option value="A" className="bg-[#1C1C1E] text-white">Section A</option>
                  <option value="B" className="bg-[#1C1C1E] text-white">Section B</option>
                  <option value="C" className="bg-[#1C1C1E] text-white">Section C</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Patient Capacity / Day</label>
                <input
                  type="number"
                  value={isNaN(formData.maxCapacity!) ? '' : formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value)})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
            </div>
          </section>

          {/* Availability & Scheduling */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-widest">Availability & Scheduling</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Consultation Days</label>
                <div className="flex flex-wrap gap-2">
                  {days.map(day => {
                    const isActive = formData.consultationDays?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isActive ? 'bg-blue-600 text-white shadow-lg' : `bg-white/5 opacity-50 ${s.text}`
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Shift Hours</label>
                  <input
                    type="text" placeholder="e.g. 09:00 AM - 02:00 PM"
                    value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Avg Time / Slot (min)</label>
                  <input
                    type="number"
                    value={isNaN(formData.avgConsultationTime!) ? '' : formData.avgConsultationTime} onChange={e => setFormData({...formData, avgConsultationTime: parseInt(e.target.value)})}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Current Status</label>
              <div className="flex gap-4">
                {['Active', 'On Leave', 'Inactive'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: status as any })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      formData.status === status 
                        ? status === 'Active' ? 'bg-emerald-500 border-emerald-500 text-white' :
                          status === 'On Leave' ? 'bg-amber-500 border-amber-500 text-white' :
                          'bg-red-500 border-red-500 text-white'
                        : `bg-white/5 border-transparent opacity-50 ${s.text}`
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Contact & Administrative */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-black uppercase tracking-widest">Contact & Administrative</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Extension / Intercom</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input
                      type="text" placeholder="Ext 4021"
                      value={formData.extension} onChange={e => setFormData({...formData, extension: e.target.value})}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Consultation Fee</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input
                      type="number" placeholder="OPD Fee"
                      value={isNaN(formData.consultationFee!) ? '' : formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: parseFloat(e.target.value)})}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="email" placeholder="doctor@hospital.com"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Phone Number</label>
                <input
                  type="tel" placeholder="Contact number for alerts"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${s.label}`}>Assistant / Nurse Tagging</label>
                <input
                  type="text" placeholder="Assigned Coordinator Name"
                  value={formData.assistantTag} onChange={e => setFormData({...formData, assistantTag: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                />
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-white/5 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${s.section} opacity-50 hover:opacity-100`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {initialData ? 'Update Doctor' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorFormModal;
