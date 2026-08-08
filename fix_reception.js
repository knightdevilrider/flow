const fs = require('fs');
let code = fs.readFileSync('views/StaffReception.tsx', 'utf8');

const restoreContent = 
const StaffReception: React.FC<StaffReceptionProps> = ({ patients, theme, doctors, isAdmin, onEditPatient, onDeletePatient }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'NetBanking' | ''>('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [optimisticDisplay, setOptimisticDisplay] = useState<Record<string, boolean>>({});

  const handlePhotoDisplayToggle = (patientId: string, checked: boolean) => {
    setOptimisticDisplay(prev => ({ ...prev, [patientId]: checked }));
    mockFirestore.updatePatient(patientId, { allowPhotoOnDisplay: checked });
  };

  const themeStyles = {
    light: {
      card: 'bg-white border-[#D2D2D7] shadow-sm',
      btn: 'bg-[#F5F5F7] hover:bg-[#E8E8ED] border-[#D2D2D7] text-[#1D1D1F]',
      accent: 'text-[#0071e3]',
;

code = code.replace(
  }
      sub: 'text-[#86868b]',,
  }


      sub: 'text-[#86868b]',
);

fs.writeFileSync('views/StaffReception.tsx', code);
console.log('Restored StaffReception.tsx');
