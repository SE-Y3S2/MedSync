'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doctorApi } from '../../services/api';
import { CheckCircle, AlertCircle, Calendar, User, ShieldCheck, Stethoscope, Clock, Pill } from 'lucide-react';

export default function VerifyPrescription() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPrescription();
    }
  }, [id]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.verifyPrescription(id as string);
      setPrescription(data);
    } catch (err: any) {
      setError(err.message || 'Prescription not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-slate-500 font-medium animate-pulse">Authenticating Digital Signature...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-2xl border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Prescription</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            This verification ID does not match any valid record in the MedSync secure database. 
            The prescription may have been cancelled, or it could be a fraudulent document.
          </p>
          <a href="/" className="inline-block px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
            Back to MedSync
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Verification Status Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-2xl border-b-8 border-emerald-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
               <ShieldCheck size={56} />
            </div>
            <div className="text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-extrabold uppercase tracking-widest rounded-full mb-2">
                 <CheckCircle size={14} /> Legally Verified
               </div>
               <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Authentic Prescription</h1>
               <p className="text-slate-500">Issued via MedSync Secure Telemedicine Network</p>
            </div>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white rounded-[28px] p-6 shadow-xl border border-slate-100 flex flex-col justify-between">
              <div>
                 <div className="flex items-center gap-3 text-blue-600 mb-4 transition-transform hover:scale-105 origin-left">
                    <Stethoscope size={20} />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Prescribing Physician</span>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-1">Dr. {prescription.doctorName}</h3>
                 <p className="text-sm text-slate-400">MedSync Network Physician</p>
              </div>
              {prescription.signatureBase64 && (
                 <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-300 mb-2">Digital Signature</p>
                    <img src={prescription.signatureBase64} alt="Doctor Signature" className="h-16 object-contain pointer-events-none" />
                 </div>
              )}
           </div>

           <div className="bg-white rounded-[28px] p-6 shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 text-emerald-600 mb-4 transition-transform hover:scale-105 origin-left">
                 <User size={20} />
                 <span className="text-xs font-extrabold uppercase tracking-widest">Authorized Patient</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{prescription.patientName}</h3>
              <p className="text-sm text-slate-400">Verified Recipient</p>
           </div>
        </div>

        {/* Medications List */}
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
           <div className="flex items-center gap-3 text-slate-800 mb-6">
              <Pill size={20} />
              <h4 className="text-lg font-bold">Prescribed Medication</h4>
           </div>

           <div className="space-y-4">
              {prescription.medications.map((m: any, idx: number) => (
                 <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-blue-50/30 hover:border-blue-100">
                    <div className="flex items-start justify-between">
                       <div>
                          <div className="text-lg font-bold text-slate-800">{m.medication}</div>
                          <div className="text-sm text-slate-600 mt-1">{m.dosage} — {m.frequency}</div>
                          {m.duration && <div className="text-xs text-slate-400 mt-2 italic">Duration: {m.duration}</div>}
                       </div>
                       <div className="text-[10px] font-bold text-blue-500 bg-white px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">SECURE RECORD</div>
                    </div>
                 </div>
              ))}
           </div>

           {prescription.instructions && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                 <div className="text-xs font-extrabold uppercase text-slate-400 tracking-widest mb-3">Pharmacist Instructions</div>
                 <div className="text-slate-700 bg-slate-50 p-4 rounded-2xl italic text-sm leading-relaxed">"{prescription.instructions}"</div>
              </div>
           )}
        </div>

        {/* Metadata */}
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-slate-900 rounded-[28px] text-white gap-4">
           <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-400" />
              <div className="text-sm">
                 <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Issue</span>
                 <strong>{new Date(prescription.issuedAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</strong>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <Clock size={18} className="text-emerald-400" />
              <div className="text-sm text-right md:text-left">
                 <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification ID</span>
                 <strong className="font-mono">{prescription.verificationId}</strong>
              </div>
           </div>
        </div>

        <div className="text-center pt-8">
           <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">Official MedSync Security Certificate</p>
           <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <div className="text-xs">🔒 End-to-End SSL</div>
              <div className="text-xs">📂 Blockchain Validated</div>
              <div className="text-xs">⚖️ HIPAA Compliant</div>
           </div>
        </div>
      </div>

      <style jsx>{`
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 5px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
