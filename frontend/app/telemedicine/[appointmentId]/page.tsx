'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { telemedicineApi, appointmentApi, patientApi, doctorApi } from '../../services/api';
import { Mic, Video, PhoneOff, Bot, FileText, Clipboard, AlertCircle, CheckCircle, Shield, Network, Trash2, Camera } from 'lucide-react';
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

  // WebRTC & Socket.io Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [remoteStreamConnected, setRemoteStreamConnected] = useState(false);

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
    
    if (sigCanvas.current?.isEmpty()) {
      showToast('Please draw your signature to authorize this prescription', 'warning');
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
      // We don't close the modal yet to show the QR code
      setPrescriptionData({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });
      if (sigCanvas.current) {
         sigCanvas.current.clear();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to issue prescription', 'error');
    } finally {
      setIsIssuing(false);
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.warn(e));
      }
    } catch (err) {
      showToast('Camera/Microphone permissions denied or device missing.', 'error');
      console.error(err);
      return;
    }

    setInCall(true);
    showToast('Secure WebRTC module initialized', 'info');

    // 1. Connect to signaling server using the current browser hostname
    const socketUrl = `http://${window.location.hostname}:3004`;
    const socket = io(socketUrl);
    socketRef.current = socket;

    // 2. Initialize Peer Connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    // Stream Local Track to P2P Connection
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Receive Remote Track
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setRemoteStreamConnected(true);
        
        // Browsers sometimes halt video rendering on dynamic track injection, force play
        remoteVideoRef.current.play().catch(e => console.warn('Video auto-play blocked by browser:', e));
      }
    };

    // Forward ICE Candidates to signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          roomId: appointmentId,
          candidate: event.candidate
        });
      }
    };

    // 3. Socket event handlers
    socket.emit('join_room', appointmentId);
    
    // ICE Candidate Buffer to fix LAN race conditions
    let iceCandidateQueue: any[] = [];
    const flushIceQueue = () => {
      while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift();
        if (candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
      }
    };

    // Originator handles user joining room
    socket.on('user_joined', async () => {
      showToast('Remote user joined. Negotiating streams...', 'success');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { roomId: appointmentId, sdp: offer });
    });

    // Receiver handles offer
    socket.on('webrtc_offer', async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      flushIceQueue();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { roomId: appointmentId, sdp: answer });
    });

    // Originator handles answer
    socket.on('webrtc_answer', async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      flushIceQueue();
    });

    // Receiver handles ICE candidate
    socket.on('ice_candidate', async (data) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          iceCandidateQueue.push(data.candidate);
        }
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    });

    socket.on('user_disconnected', () => {
      showToast('User disconnected from the room.', 'warning');
      setRemoteStreamConnected(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });
  };

  const endCall = async () => {
    // Teardown WebRTC connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setInCall(false);
    setRemoteStreamConnected(false);
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
      
      {!inCall ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="med-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', borderTop: '6px solid var(--primary)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 24px' }}>
                🎥
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Ready to connect?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Consultation with <strong>{user?.role === 'patient' ? `Dr. ${appointment?.doctorName}` : appointment?.patientName}</strong>. 
                Ensure your camera and microphone are permitted.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <Button className="primary" style={{ padding: '16px', fontSize: '1.1rem' }} onClick={startCall}>
                   Join Secure Consultation Room
                 </Button>
                 <Button className="secondary" onClick={() => router.back()}>
                   Cancel & Go Back
                 </Button>
              </div>
           </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
          {/* Main Video Area */}
          <div style={{ flex: 1, background: '#0f172a', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-lg)' }}>
            {/* Live Remote Video */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: remoteStreamConnected ? 'block' : 'none' }}
            />

            {!remoteStreamConnected && (
              <div style={{ textAlign: 'center' }}>
                <div className="avatar lg" style={{ margin: '0 auto 16px', border: '4px solid #334155' }}>
                  {user?.role === 'patient' ? '👨‍⚕️' : '👤'}
                </div>
                <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>
                   Waiting for {user?.role === 'patient' ? `Dr. ${appointment?.doctorName}` : appointment?.patientName} to join...
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }} className="animate-pulse">Monitoring P2P Signaling Server</p>
              </div>
            )}

            {/* PIP (Local Video) */}
            <div style={{ position: 'absolute', top: '24px', right: '24px', width: '200px', aspectRatio: '16/9', background: '#1e293b', borderRadius: 'var(--radius-md)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
               <video 
                 ref={localVideoRef} 
                 autoPlay 
                 playsInline 
                 muted
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
               />
               <div style={{ position: 'absolute', top: '8px', left: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>Self View</div>
            </div>

            {/* Floating Controls */}
            <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
               <button style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={20} />
               </button>
               <button style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={20} />
               </button>
               <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
               <button 
                onClick={endCall}
                style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--error)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)' }}
               >
                  <PhoneOff size={24} />
               </button>
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

                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                     {activeTab === 'ai' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Live AI Summarization</h4>
                              <span className="badge info" style={{ fontSize: '0.7rem' }}>Analysing...</span>
                           </div>
                           <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                              {simulatedTime < 10 ? 'Waiting for patient conversation to start...' : (
                                <>
                                  <strong style={{ display: 'block', fontStyle: 'normal', color: 'var(--primary)', marginBottom: '4px' }}>Detected Symptoms:</strong>
                                  "Severe headache specifically in the frontal region. Duration: 2 days. Mentioned sensitivity to light."
                                </>
                              )}
                           </div>
                           {simulatedTime > 20 && (
                              <div className="result-card urgency-medium" style={{ opacity: 1, transform: 'none' }}>
                                 <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: '4px' }}>AI Recommendation:</strong>
                                 Evaluate for acute migraine. Ask about nausea or history of similar episodes.
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

                  <div style={{ padding: '16px', background: 'var(--bg-main)', borderTop: '1px solid var(--card-border)' }}>
                     <Button className="secondary" style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700, padding: '12px' }} onClick={endCall}>
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

