const fs = require('fs');

// 1. Update App.tsx
let appStr = fs.readFileSync('App.tsx', 'utf8');
appStr = appStr.replace(
  /const handleBack = \(\) => \{\n    if \(showSettings\)/s,
  `const handleBack = () => {
    const event = new CustomEvent('app-back-button', { cancelable: true });
    window.dispatchEvent(event);
    if (event.defaultPrevented) return;
    if (showSettings)`
);
fs.writeFileSync('App.tsx', appStr);

// 2. Update StaffGate.tsx
let gateStr = fs.readFileSync('views/StaffGate.tsx', 'utf8');
gateStr = gateStr.replace(
  /const \[step, setStep\] = useState<'selection' \| 'form'>\('selection'\);/,
  `const [step, setStep] = useState<'selection' | 'form'>('selection');

  useEffect(() => {
    const handleAppBack = (e) => {
      if (step === 'form') {
        e.preventDefault();
        setStep('selection');
      }
    };
    window.addEventListener('app-back-button', handleAppBack);
    return () => window.removeEventListener('app-back-button', handleAppBack);
  }, [step]);`
);
fs.writeFileSync('views/StaffGate.tsx', gateStr);

// 3. Update StaffDoctor.tsx
let docStr = fs.readFileSync('views/StaffDoctor.tsx', 'utf8');
docStr = docStr.replace(
  /const isProcessingAutoCall = useRef\(false\);/,
  `const isProcessingAutoCall = useRef(false);

  useEffect(() => {
    const handleAppBack = (e) => {
      if (showPrintPreview) { e.preventDefault(); setShowPrintPreview(false); return; }
      if (showHistoryTimeline) { e.preventDefault(); setShowHistoryTimeline(false); return; }
      if (showDailyDigest) { e.preventDefault(); setShowDailyDigest(false); return; }
      if (viewingPatient) { e.preventDefault(); setViewingPatient(null); return; }
      if (activeDoctorId) { e.preventDefault(); setActiveDoctorId(''); return; }
    };
    window.addEventListener('app-back-button', handleAppBack);
    return () => window.removeEventListener('app-back-button', handleAppBack);
  }, [showPrintPreview, showHistoryTimeline, showDailyDigest, viewingPatient, activeDoctorId]);`
);
fs.writeFileSync('views/StaffDoctor.tsx', docStr);

// 4. Update PublicDisplayView.tsx
let pubStr = fs.readFileSync('views/PublicDisplayView.tsx', 'utf8');
pubStr = pubStr.replace(
  /const lastAnnouncedRef = useRef<Record<string, number>>\(\{\}\);/,
  `const lastAnnouncedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleAppBack = (e) => {
      if (targetDoctorId) { e.preventDefault(); setTargetDoctorId(''); return; }
      if (targetWard) { e.preventDefault(); setTargetWard(''); return; }
      if (targetTreatment) { e.preventDefault(); setTargetTreatment(''); return; }
    };
    window.addEventListener('app-back-button', handleAppBack);
    return () => window.removeEventListener('app-back-button', handleAppBack);
  }, [targetDoctorId, targetWard, targetTreatment]);`
);
fs.writeFileSync('views/PublicDisplayView.tsx', pubStr);

// 5. Update StaffWardCare.tsx
let wardStr = fs.readFileSync('views/StaffWardCare.tsx', 'utf8');
wardStr = wardStr.replace(
  /const \[activeBedId, setActiveBedId\] = useState<string>('');/,
  `const [activeBedId, setActiveBedId] = useState<string>('');

  useEffect(() => {
    const handleAppBack = (e) => {
      if (activeBedId) { e.preventDefault(); setActiveBedId(''); return; }
      if (activeWardId) { e.preventDefault(); setActiveWardId(''); return; }
    };
    window.addEventListener('app-back-button', handleAppBack);
    return () => window.removeEventListener('app-back-button', handleAppBack);
  }, [activeBedId, activeWardId]);`
);
fs.writeFileSync('views/StaffWardCare.tsx', wardStr);

console.log('Done!');
