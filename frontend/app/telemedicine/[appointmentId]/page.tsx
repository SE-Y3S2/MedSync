'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { 
  telemedicineApi, 
  appointmentApi, 
  patientApi, 
  doctorApi, 
  symptomApi, 
  getAuthToken 
} from '../../services/api';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Bot, FileText, Clipboard, AlertCircle, CheckCircle, Shield, Network, Trash2, Camera, MessageSquare, Send } from 'lucide-react';
import { MedButton as Button, Modal, MedInput as Input, showToast } from '../../components/UI';
import SignatureCanvas from 'react-signature-canvas';
import { io, Socket } from 'socket.io-client';

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
  const [issuedQrCode, setIssuedQrCode] = useState<string | null>(null);
  const [issuedPrescription, setIssuedPrescription] = useState<any>(null);
  const sigCanvas = useRef<any>(null);

  // Jitsi Meet State
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  // Transcription & Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [transcript, setTranscript] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  // Media Controls State
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Load Jitsi External API Script Dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('MedSync: Jitsi Meet Infrastructure Loaded');
      setJitsiLoaded(true);
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize Jitsi Meeting
  useEffect(() => {
    if (jitsiLoaded && jitsiContainerRef.current && appointment && user) {
       console.log('MedSync: Establishing secure global consultation bridge...');
       
       const options = {
          roomName: `MedSync-Consult-${appointmentId}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
             displayName: user.role === 'doctor' ? `Dr. ${user.name}` : user.name,
             email: user.email
          },
          configOverwrite: {
             startWithAudioMuted: false,
             startWithVideoMuted: false,
             enableWelcomePage: false,
             prejoinPageEnabled: false,
             disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
             TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                'security'
             ],
             SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
             SHOW_JITSI_WATERMARK: false,
             SHOW_WATERMARK_FOR_GUESTS: false,
          }
       };

       const api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', options);
       setJitsiApi(api);
       setInCall(true);

       // Auto-start AI Scribe if doctor
       if (user.role === 'doctor') {
          startSpeechRecognition();
       }

       return () => {
          api.dispose();
       };
    }
  }, [jitsiLoaded, appointment, user, appointmentId]);

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

  // Automated AI Analysis Loop (Doctor Only)
  useEffect(() => {
    if (user?.role === 'doctor' && transcript.length > 50 && !isAnalyzing) {
      const timer = setTimeout(async () => {
        setIsAnalyzing(true);
        try {
          const result = await symptomApi.analyzeSymptoms(transcript);
          setAiAnalysis(result);
        } catch (e) {
          console.error('AI Analysis failed', e);
        } finally {
          setIsAnalyzing(false);
        }
      }, 5000); // Analyze every 5 seconds if text changed
      return () => clearTimeout(timer);
    }
  }, [transcript, user?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const apptId = String(appointmentId);
      const appt = await appointmentApi.getAppointment(apptId);
      setAppointment(appt);
      
      if (user?.role === 'doctor') {
        try {
          const records = await patientApi.getPatientDocuments(appt.patientId);
          setPatientRecords(records || []);
        } catch (e) {
          console.warn('Could not load patient records', e);
        }
      }
    } catch (err) {
      showToast('Error loading session data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript.trim()) {
        if (user?.role === 'doctor') setTranscript(prev => prev + ' ' + finalTranscript);
      }
    };

    recognition.onend = () => { if (inCall) recognition.start(); };
    recognition.start();
  };

  const handleIssuePrescription = async () => {
    if (!prescriptionData.medication || !prescriptionData.dosage) {
      showToast('Please fill required fields', 'warning');
      return;
    }
    
    if (sigCanvas.current?.isEmpty()) {
      showToast('Signature required', 'warning');
      return;
    }

    setIsIssuing(true);
    try {
      const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      const result = await doctorApi.issuePrescription({
        patientId: appointment?.patientId,
        patientName: appointment?.patientName,
        doctorName: user?.name,
        appointmentId: appointmentId as string,
        medications: [{
          medication: prescriptionData.medication,
          dosage: prescriptionData.dosage,
          frequency: prescriptionData.frequency,
          duration: prescriptionData.duration
        }],
        instructions: prescriptionData.instructions,
        signatureBase64
      });
      
      setIssuedQrCode(result.qrCode);
      setIssuedPrescription(result.prescription);

      showToast('Digital Prescription issued securely!', 'success');
      setPrescriptionData({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });
      sigCanvas.current?.clear();
    } catch (err: any) {
      showToast(err.message || 'Failed to issue prescription', 'error');
    } finally {
      setIsIssuing(false);
    }
  };

  const endCall = async () => {
    if (jitsiApi) {
      jitsiApi.dispose();
    }
    setInCall(false);
    setCallEnded(true);
    if (user?.role === 'doctor') {
      try {
        await appointmentApi.updateStatus(appointmentId as string, { status: 'completed' });
      } catch (err) {}
    }
    router.push('/dashboard');
  };

  if (authLoading || loading) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-500 font-medium">Initializing secure video session...</p>
     </div>
  );
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', maxHeight: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.8rem' }}>Telemedicine Session</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
             <span className="badge low">
               <Shield size={12} style={{ marginRight: '4px' }} /> End-to-End Encrypted
             </span>
             <span className="badge info">
               <Network size={12} style={{ marginRight: '4px' }} /> Optimized Network
             </span>
          </div>
        </div>
        {inCall && (
           <div style={{ background: 'var(--primary-dark)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }} className="animate-pulse"></span>
              {formatTime(simulatedTime)}
           </div>
        )}
      </div>
      
      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
          {/* Global Video Bridge Area */}
          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ 
              flex: 1, 
              background: '#0f172a', 
              borderRadius: 'var(--radius-2xl)', 
              position: 'relative', 
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {/* Jitsi Meeting Frame */}
              <div 
                ref={jitsiContainerRef} 
                style={{ width: '100%', height: '100%' }}
              />

              {!jitsiLoaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: '#0f172a' }}>
                   <div className="loading-spinner"></div>
                   <p style={{ marginTop: '16px', color: '#94a3b8', fontWeight: 500 }}>Connecting to Global Medical Bridge...</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Tools - Only for Doctor */}
          {user?.role === 'doctor' && (
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
               <div className="med-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: 0 }}>
                  <div className="tabs-header" style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
                     <button 
                       onClick={() => setActiveTab('ai')}
                       className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
                       style={{ flex: 1, padding: '16px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                     >
                       <Bot size={16} /> AI Scribe
                     </button>
                     <button 
                       onClick={() => setActiveTab('records')}
                       className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
                       style={{ flex: 1, padding: '16px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                     >
                       <FileText size={16} /> History
                     </button>
                     <button 
                        onClick={() => setActiveTab('prescription')}
                        className={`tab-button ${activeTab === 'prescription' ? 'active' : ''}`}
                        style={{ flex: 1, padding: '16px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Clipboard size={16} /> Rx
                      </button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scrollbar">
                      {activeTab === 'ai' && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                               <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Live AI Scribe (Transcription)</h4>
                               {isAnalyzing && <span className="badge info" style={{ fontSize: '0.7rem' }}>Thinking...</span>}
                            </div>
                            <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: transcript ? 'normal' : 'italic', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }} className="custom-scrollbar">
                               {transcript || 'Waiting for patient to speak (English only)...'}
                            </div>
                            
                            {aiAnalysis && (
                               <div className={`result-card urgency-${aiAnalysis.overallUrgency}`} style={{ opacity: 1, transform: 'none' }}>
                                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>AI Insights:</strong>
                                  <p style={{ fontSize: '0.8rem', marginBottom: '12px', lineHeight: 1.4 }}>{aiAnalysis.aiSummary}</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                     {aiAnalysis.results.map((r: any, idx: number) => (
                                        <span key={idx} className="badge info" style={{ fontSize: '0.65rem' }}>Suggest: {r.specialty}</span>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      )}

                     {activeTab === 'records' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                           <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Medical Reports Review</h4>
                           {loadingRecords ? (
                              <div style={{ padding: '40px 0', textAlign: 'center' }}>Loading...</div>
                           ) : patientRecords.length === 0 ? (
                              <div className="empty-state" style={{ padding: '32px 16px' }}>
                                 <p style={{ fontSize: '0.8rem' }}>No reports available</p>
                              </div>
                           ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 {patientRecords.map((r, i) => (
                                    <div key={i} className="doc-item">
                                       <div>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name || 'Report'}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                                       </div>
                                       <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>VIEW</a>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}

                     {activeTab === 'prescription' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Issue Prescription</h4>
                              <Button className="primary sm" onClick={() => setShowPrescriptionModal(true)}>Open Editor</Button>
                           </div>
                           <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              You can issue a digital prescription now. It will be immediately available to the patient after the session ends.
                           </p>
                           <div style={{ padding: '16px', background: 'var(--primary-light)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Awaiting medical decision...</div>
                           </div>
                        </div>
                     )}
                  </div>

                  <div style={{ padding: '16px', background: 'var(--bg-main)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '12px' }}>
                     <Button className="secondary" style={{ flex: 1, fontSize: '0.9rem', fontWeight: 700, padding: '12px' }} onClick={endCall}>
                        Finalize Consultation
                     </Button>
                  </div>
               </div>
            </div>
          )}
        </div>

      {/* Prescription Modal - Live Editor */}
      <Modal 
        isOpen={showPrescriptionModal} 
        onClose={() => setShowPrescriptionModal(false)} 
        title="Live Prescription Issuance"
      >
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {issuedQrCode ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                 <div style={{ width: '80px', height: '80px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={40} />
                 </div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Successfully Issued</h3>
                 <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Verification ID: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{issuedPrescription?.verificationId}</span></p>
                 
                 <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-xl)', border: '4px solid var(--success-light)', display: 'inline-block', boxShadow: 'var(--shadow-lg)', marginBottom: '24px' }}>
                    <img src={issuedQrCode} alt="Verification QR Code" style={{ width: '180px', height: '180px' }} />
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button className="secondary" onClick={() => {
                       setShowPrescriptionModal(false);
                       setIssuedQrCode(null);
                       setActiveTab('ai');
                    }}>Done</Button>
                    <a 
                      href={`/verify/${issuedPrescription?.verificationId}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
                    >
                      View Public Verification Page
                    </a>
                 </div>
              </div>
           ) : (
              <>
                 <Input 
                   label="Medication" 
                   value={prescriptionData.medication} 
                   onChange={(e) => setPrescriptionData({...prescriptionData, medication: e.target.value})}
                   placeholder="e.g. Sumatriptan"
                 />
                 <div className="grid-2">
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
                   <label className="med-label">Clinical Instructions</label>
                   <textarea 
                     className="med-input" 
                     value={prescriptionData.instructions} 
                     onChange={(e) => setPrescriptionData({...prescriptionData, instructions: e.target.value})}
                     placeholder="Take at the onset of headache..."
                     style={{ minHeight: '80px' }}
                   />
                 </div>

                 <div className="med-input-group" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                       <label className="med-label" style={{ marginBottom: 0 }}>Digital Signature <span style={{ color: 'var(--error)' }}>*</span></label>
                       <button 
                         type="button"
                         onClick={() => sigCanvas.current?.clear()} 
                         style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                       >
                         <Trash2 size={12} /> Clear Signature
                       </button>
                    </div>
                    <div style={{ border: '2px dashed var(--card-border)', borderRadius: 'var(--radius-md)', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                       <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.2 }}>
                          <span style={{ fontFamily: 'serif', fontSize: '2rem', color: 'var(--text-muted)', fontWeight: 700, transform: 'rotate(-10deg)' }}>Sign Here</span>
                       </div>
                       <SignatureCanvas 
                         ref={sigCanvas}
                         penColor="#1e293b"
                         canvasProps={{style: {width: '100%', height: '140px', position: 'relative', zIndex: 10, cursor: 'crosshair'} }} 
                       />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>By signing above, you are legally authorizing the issuance of this prescription to the patient.</p>
                 </div>
                 
                 <Button 
                  className="primary" 
                  style={{ width: '100%', padding: '16px', fontSize: '1rem', boxShadow: 'var(--shadow-md)' }} 
                  onClick={handleIssuePrescription}
                  disabled={isIssuing}
                 >
                   {isIssuing ? 'Issuing...' : 'Verify & Send to Patient'}
                 </Button>
              </>
           )}
         </div>
      </Modal>

      {/* Post-Call Summary Modal */}
      <Modal 
        isOpen={callEnded} 
        onClose={() => router.push(user?.role === 'doctor' ? '/doctor/appointments' : '/patient')}
        title="Consultation Summary"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
           <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem' }}>
              📝
           </div>
           <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Video Call Ended</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
              Your session with {user?.role === 'patient' ? `Dr. ${appointment?.doctorName}` : appointment?.patientName} has concluded.
           </p>

           {issuedQrCode ? (
              <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--card-border)', marginBottom: '32px' }}>
                 <div style={{ color: 'var(--success)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle size={18} /> Prescription Available
                 </div>
                 <img src={issuedQrCode} alt="Prescription QR" style={{ width: '150px', height: '150px', margin: '16px 0', border: '4px solid white', borderRadius: '8px' }} />
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan this code at any participating pharmacy to fulfill your prescription.</p>
              </div>
           ) : (
              <div style={{ padding: '24px', background: 'var(--bg-main)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
                 No digital prescriptions were issued during this session.
              </div>
           )}

           <Button 
            className="primary" 
            style={{ width: '100%', padding: '14px' }} 
            onClick={() => router.push(user?.role === 'doctor' ? '/doctor/appointments' : '/patient')}
           >
              Return to Dashboard
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
      {/* Professional Connection Status Indicator */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
        background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '12px', fontWeight: 600,
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)', pointerEvents: 'none'
      }}>
        <div style={{ 
          width: '8px', height: '8px', borderRadius: '50%', 
          background: inCall ? '#10b981' : '#f59e0b',
          boxShadow: inCall ? '0 0 12px #10b981' : '0 0 12px #f59e0b'
        }} />
        {inCall ? 'Global Global Secured Bridge' : 'Syncing Cloud...'}
      </div>
    </div>
  );
}


