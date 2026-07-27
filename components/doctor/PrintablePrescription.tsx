import React from 'react';
import { Patient } from '../../types';
import { PrescribedDrug } from './RxWriter';

interface PrintablePrescriptionProps {
  patient: Patient;
  doctor: any;
  prescription: string;
  prescribedDrugs: PrescribedDrug[];
  diagnosisICD?: string;
  onClose: () => void;
}

const PrintablePrescription: React.FC<PrintablePrescriptionProps> = ({ 
  patient, 
  doctor, 
  prescription, 
  prescribedDrugs, 
  diagnosisICD,
  onClose 
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col print:absolute print:inset-0">
      {/* Non-printable controls */}
      <div className="print:hidden p-4 bg-gray-100 border-b flex justify-between items-center shadow-sm">
        <h3 className="font-bold text-gray-800">Print Preview</h3>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Print Prescription
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg font-bold hover:bg-gray-200 transition-colors text-black"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full text-black bg-white" id="prescription-print-area">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">CARE HOSPITAL</h1>
            <p className="text-sm font-semibold text-gray-600 mt-1">Multi-Speciality Health Center</p>
            <p className="text-xs text-gray-500">123 Health Avenue, Medical District, City - 400001</p>
            <p className="text-xs text-gray-500">Phone: +91 98765 43210 | Emergency: 1066</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{doctor?.name || 'Dr. Consultant'}</h2>
            <p className="text-sm font-medium">{doctor?.specialty || 'General Medicine'}</p>
            <p className="text-xs text-gray-600">Reg No: {doctor?.regNumber || 'MC-87654'}</p>
          </div>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Patient Name:</span>
              <span className="font-bold text-lg leading-none">{patient.name}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Patient ID:</span>
              <span className="font-semibold text-sm">{patient.id}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex justify-end gap-4 mb-1">
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Age:</span>
                <span className="font-bold">{patient.age} Y</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Gender:</span>
                <span className="font-bold">{patient.gender}</span>
              </div>
            </div>
            <div className="flex justify-end items-end gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Date:</span>
              <span className="font-semibold text-sm">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Vitals (If available) */}
        {patient.vitals && (
          <div className="mb-8 border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b pb-1">Recorded Vitals</h4>
            <div className="flex gap-8">
              {patient.vitals.temperature && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Temp</div>
                  <div className="font-bold">{patient.vitals.temperature}°F</div>
                </div>
              )}
              {patient.vitals.bloodPressure && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">BP</div>
                  <div className="font-bold">{patient.vitals.bloodPressure}</div>
                </div>
              )}
              {patient.vitals.pulse && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Pulse</div>
                  <div className="font-bold">{patient.vitals.pulse} bpm</div>
                </div>
              )}
              {patient.vitals.weight && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Weight</div>
                  <div className="font-bold">{patient.vitals.weight} kg</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        {(diagnosisICD || prescription) && (
          <div className="mb-8">
             <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Clinical Diagnosis & Findings</h4>
             {diagnosisICD && (
               <div className="mb-2">
                 <span className="font-bold text-sm bg-blue-50 px-2 py-1 rounded border border-blue-100">{diagnosisICD}</span>
               </div>
             )}
             {prescription && (
               <p className="text-sm whitespace-pre-wrap leading-relaxed">{prescription}</p>
             )}
          </div>
        )}

        {/* Rx */}
        {prescribedDrugs.length > 0 && (
          <div className="mb-8">
            <div className="text-4xl font-serif text-gray-300 italic mb-4 relative -left-2">Rx</div>
            <div className="space-y-4 ml-4">
              {prescribedDrugs.map((drug, index) => (
                <div key={drug.id} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex justify-between items-end mb-1">
                    <div className="font-bold text-lg">{index + 1}. {drug.name} <span className="text-sm font-normal ml-2">{drug.dosage}</span></div>
                    <div className="text-sm font-semibold">{drug.duration}</div>
                  </div>
                  <div className="text-sm text-gray-600 flex gap-4">
                    <span>{drug.frequency}</span>
                    <span className="text-gray-300">•</span>
                    <span>{drug.timing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Signature */}
        <div className="mt-20 flex justify-between items-end border-t border-gray-200 pt-8">
          <div className="text-xs text-gray-500">
            <p>Generated electronically via Hospital Information System.</p>
            <p>Valid only with original stamp and signature in case of physical print.</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-black mb-2"></div>
            <p className="font-bold">{doctor?.name || 'Doctor Signature'}</p>
            <p className="text-xs text-gray-600">Authorized Signatory</p>
          </div>
        </div>
        
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-print-area, #prescription-print-area * {
            visibility: visible;
          }
          #prescription-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 20px;
          }
        }
      `}} />
    </div>
  );
};

export default PrintablePrescription;
