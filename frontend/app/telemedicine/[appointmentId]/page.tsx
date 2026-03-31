'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { telemedicineApi, appointmentApi, patientApi } from '../../services/api';
import { Mic, Video, PhoneOff, Bot, FileText, Clipboard, AlertCircle, CheckCircle, Shield, Network } from 'lucide-react';
import { MedButton as Button, Modal, MedInput as Input, showToast } from '../../components/UI';

export default function TelemedicineSession() {
  const { appointmentId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'ai' | 'records' | 'prescription'>('ai');
  
  // Patient Records state
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  // Prescription state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
     medication: '',
     dosage: '',
     frequency: '',
     duration: '',
     instructions: ''
  });
  const [isIssuing, setIsIssuing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    let interval: any;
    if (inCall) {
      interval = setInterval(() => setSimulatedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [inCall]);

  const loadData = async () => {
    try {
      setLoading(true);
      const apptId = appointmentId as string;

      let appt: any = null;
      try {
        appt = await appointmentApi.getAppointment(apptId);
        setAppointment(appt);
      } catch (e) {
        appt = null;
      }

      try {
        const sessData = await telemedicineApi.getSession(apptId);
        setSession(sessData);
      } catch (e) {
        if (!appt) {
          setSession(null);
          return;
        }

        const sessData = await telemedicineApi.createSession({
          appointmentId: apptId,
          doctorId: appt.doctorId,
          patientId: appt.patientId,
        });
        setSession(sessData);
      }
      
      // Pre-fetch records if doctor
      if (user?.role === 'doctor' && appt) {
         loadPatientRecords(appt.patientId);
      }
    } catch (err) {
      console.error(err);
      setSession(null);
    }
    finally {
      setLoading(false);
    }
  };

  const loadPatientRecords = async (patientId: string) => {
     setLoadingRecords(true);
     try {
        const docs = await patientApi.getPatientDocuments(patientId);
        setPatientRecords(docs || []);
     } catch (err) {
        console.warn('Could not fetch patient documents');
     } finally {
        setLoadingRecords(false);
     }
  };

  const handleIssuePrescription = async () => {
    if (!prescriptionData.medication || !prescriptionData.dosage) {
      showToast('Please fill required fields', 'warning');
      return;
    }
    setIsIssuing(true);
    try {
      await patientApi.doctorIssuePrescription(appointment?.patientId, {
        ...prescriptionData,
        prescribedBy: user?.name,
        date: new Date()
      });
      showToast('Prescription issued!', 'success');
      setShowPrescriptionModal(false);
      setPrescriptionData({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });
      setActiveTab('ai');
    } catch (err: any) {
      showToast(err.message || 'Failed to issue prescription', 'error');
    } finally {
      setIsIssuing(false);
    }
  };

  const startCall = async () => {
    setInCall(true);
    showToast('Secure connection established', 'success');
  };

  const endCall = async () => {
    if (!confirm('Are you sure you want to end this consultation?')) return;
    try {
      await telemedicineApi.endSession(appointmentId as string);
      setInCall(false);
      
      // Complete appointment automatically if doctor
      if (user?.role === 'doctor') {
         await appointmentApi.updateStatus(appointmentId as string, { status: 'completed', notes: 'Consultation ended by doctor' });
         router.push('/doctor/appointments');
      } else {
         router.push('/patient');
      }
    } catch (err) {
      setInCall(false);
      router.back();
    }
  };

  if (authLoading || loading) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-500 font-medium">Initializing secure video session...</p>
     </div>
  );
  
  if (!session) return (
     <div className="med-card urgency-high max-w-lg mx-auto mt-20">
        <h3 className="flex items-center gap-2 font-bold mb-2"><AlertCircle /> Session Expired</h3>
        <p>This telemedicine session link is no longer valid or has been closed.</p>
        <Button onClick={() => router.back()} className="mt-4 secondary sm">Go Back</Button>
     </div>
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-in flex flex-col h-[calc(100vh-130px)] max-h-[900px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Telemedicine Session</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
               <Shield size={10} /> End-to-End Encrypted
             </span>
             <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
               <Network size={10} /> Optimized Network
             </span>
          </div>
        </div>
        {inCall && (
           <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-mono flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {formatTime(simulatedTime)}
           </div>
        )}
      </div>
      
      {!inCall ? (
        <div className="flex-1 flex items-center justify-center">
           <div className="med-card max-w-[500px] w-full text-center border-t-8 border-t-blue-600 shadow-2xl">
              <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-blue-100">
                🎥
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to connect?</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Consultation with <strong>{user?.role === 'patient' ? `Dr. ${appointment?.doctorName}` : appointment?.patientName}</strong>. 
                Ensure your camera and microphone are permitted.
              </p>
              <div className="space-y-3">
                 <Button className="primary w-full py-4 text-lg" onClick={startCall}>
                   Join Secure Consultation Room
                 </Button>
                 <Button className="secondary w-full" onClick={() => router.back()}>
                   Cancel & Go Back
                 </Button>
              </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Main Video Area */}
          <div className="flex-1 bg-slate-900 rounded-[32px] relative overflow-hidden shadow-2xl flex items-center justify-center group ring-8 ring-slate-100 dark:ring-slate-900/50">
            {/* Mock Remote Video */}
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl overflow-hidden">
                {user?.role === 'patient' ? <span className="text-blue-400">👨‍⚕️</span> : <span className="text-emerald-400">👤</span>}
              </div>
              <h3 className="text-white text-xl font-bold tracking-wide">
                 {user?.role === 'patient' ? `Dr. ${appointment?.doctorName}` : appointment?.patientName}
              </h3>
              <p className="text-slate-400 text-sm mt-1 animate-pulse">Establishing data streams...</p>
            </div>

            {/* PIP (Local) */}
            <div className="absolute top-8 right-8 w-44 md:w-60 aspect-video bg-slate-800 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center ring-4 ring-black/20">
               <div className="text-white/20 text-xs font-mono uppercase tracking-widest">Self View</div>
               <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 text-[10px] text-white rounded font-bold backdrop-blur-md">Local API</div>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-slate-900/80 backdrop-blur-2xl rounded-[28px] border border-white/10 shadow-2xl transform transition-all group-hover:bottom-10">
               <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <Mic size={20} />
               </button>
               <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <Video size={20} />
               </button>
               <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
               <button 
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110"
               >
                  <PhoneOff size={24} />
               </button>
            </div>
          </div>

          {/* Sidebar / Tools - Only for Doctor */}
          {user?.role === 'doctor' && (
            <div className="w-[380px] flex flex-col gap-4 min-h-0">
               <div className="med-card flex-1 !p-0 flex flex-col shadow-xl overflow-hidden">
                  <div className="flex border-b border-slate-100">
                     <button 
                       onClick={() => setActiveTab('ai')}
                       className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       <Bot size={16} /> AI Scribe
                     </button>
                     <button 
                       onClick={() => setActiveTab('records')}
                       className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'records' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       <FileText size={16} /> History
                     </button>
                     <button 
                       onClick={() => setActiveTab('prescription')}
                       className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'prescription' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       <Clipboard size={16} /> Rx
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                     {activeTab === 'ai' && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-800">Live AI Summarization</h4>
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">Analysing...</span>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 italic leading-relaxed">
                              {simulatedTime < 10 ? 'Waiting for patient conversation to start...' : (
                                <>
                                  <span className="font-bold text-blue-600 not-italic block mb-1">Detected Symptoms:</span>
                                  "Severe headache specifically in the frontal region. Duration: 2 days. Mentioned sensitivity to light."
                                </>
                              )}
                           </div>
                           {simulatedTime > 20 && (
                              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50 text-sm animate-in">
                                 <strong className="text-amber-700 block mb-1">AI Recommendation:</strong>
                                 Evaluate for acute migraine. Ask about nausea or history of similar episodes.
                              </div>
                           )}
                        </div>
                     )}

                     {activeTab === 'records' && (
                        <div className="space-y-4">
                           <h4 className="text-sm font-bold text-slate-800">Medical Reports Review</h4>
                           {loadingRecords ? (
                              <div className="py-12 text-center"><div className="loading-spinner sm mx-auto"></div></div>
                           ) : patientRecords.length === 0 ? (
                              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                 <p className="text-xs text-slate-400">No reports available</p>
                              </div>
                           ) : (
                              <div className="space-y-2">
                                 {patientRecords.map((r, i) => (
                                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all flex items-center justify-between group">
                                       <div className="flex-1 truncate pr-2">
                                          <div className="text-xs font-bold text-slate-700 truncate">{r.name || 'Report'}</div>
                                          <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                                       </div>
                                       <a href={r.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">VIEW</a>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}

                     {activeTab === 'prescription' && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-800">Issue Prescription</h4>
                              <Button className="primary sm px-3" onClick={() => setShowPrescriptionModal(true)}>Open Editor</Button>
                           </div>
                           <p className="text-xs text-slate-500 leading-relaxed">
                              You can issue a digital prescription now. It will be immediately available to the patient after the session ends.
                           </p>
                           <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                              <div className="text-[10px] font-extrabold text-blue-600 uppercase mb-1">Status</div>
                              <div className="text-xs font-medium text-blue-800">Awaiting medical decision...</div>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                     <Button className="secondary w-full !text-xs font-bold py-3" onClick={endCall}>
                        Finalize Consultation
                     </Button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Prescription Modal - Live Editor */}
      <Modal 
        isOpen={showPrescriptionModal} 
        onClose={() => setShowPrescriptionModal(false)} 
        title="Live Prescription Issuance"
      >
        <div className="space-y-4">
           <Input 
             label="Medication" 
             value={prescriptionData.medication} 
             onChange={(e) => setPrescriptionData({...prescriptionData, medication: e.target.value})}
             placeholder="e.g. Sumatriptan"
           />
           <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Dosage" 
                value={prescriptionData.dosage} 
                onChange={(e) => setPrescriptionData({...prescriptionData, dosage: e.target.value})}
                placeholder="50mg"
              />
              <Input 
                label="Frequency" 
                value={prescriptionData.frequency} 
                onChange={(e) => setPrescriptionData({...prescriptionData, frequency: e.target.value})}
                placeholder="Once daily"
              />
           </div>
           <div className="med-input-group">
             <label className="med-label text-sm font-bold text-slate-700">Clinical Instructions</label>
             <textarea 
               className="med-input min-h-[80px]" 
               value={prescriptionData.instructions} 
               onChange={(e) => setPrescriptionData({...prescriptionData, instructions: e.target.value})}
               placeholder="Take at the onset of headache..."
             />
           </div>
           <Button 
            className="primary w-full py-4 shadow-xl" 
            onClick={handleIssuePrescription}
            disabled={isIssuing}
           >
             {isIssuing ? 'Issuing...' : 'Verify & Send to Patient'}
           </Button>
        </div>
      </Modal>

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f1f5f9;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-spinner.sm { width: 30px; height: 30px; border-width: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

