'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { telemedicineApi, appointmentApi } from '../../services/api';

export default function TelemedicineSession() {
  const { appointmentId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);

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
    } catch (err) {
      console.error(err);
      setSession(null);
    }
    finally {
      setLoading(false);
    }
  };

  const startCall = async () => {
    setInCall(true);
    // In a real Agora integration we would use agora-rtc-react to connect here
  };

  const endCall = async () => {
    try {
      await telemedicineApi.endSession(appointmentId as string);
      setInCall(false);
      alert('Consultation ended successfully.');
      
      // Send doctor back to appointments, patient back to dashboard
      if (user?.role === 'doctor') {
        router.push('/doctor/appointments');
      } else {
        router.push('/patient');
      }
    } catch (err) {
      alert('Failed to end session cleanly');
      setInCall(false);
    }
  };

  if (authLoading || loading) return <div className="animate-in" style={{ padding: '20px' }}>Loading session...</div>;
  if (!session) return <div className="empty-state"><h3>Session not found or invalid</h3></div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className="page-title" style={{ marginBottom: '16px' }}>Telemedicine Consultation</h1>
      
      {!inCall ? (
        <div className="med-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', marginTop: '40px' }}>
          <div className="avatar lg" style={{ margin: '0 auto 20px', background: 'var(--success)' }}>
            🎥
          </div>
          <h2>Ready to connect?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            Ensure your camera and microphone are allowed. The consultation will automatically begin recording symptoms for AI summarization.
          </p>
          <button className="med-button primary" style={{ width: '100%', fontSize: '1.1rem', padding: '14px' }} onClick={startCall}>
            Join Virtual Waiting Room
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '20px', height: '100%' }}>
          {/* Main Video View */}
          <div style={{ flex: 1, background: '#000', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Mock Remote Video Stream */}
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div className="avatar lg" style={{ margin: '0 auto 20px', opacity: 0.8 }}>
                {user?.role === 'patient' ? 'Dr.' : '👤'}
              </div>
              <h3>Connected</h3>
              <p style={{ color: '#aaa', marginTop: '8px' }}>{formatTime(simulatedTime)}</p>
            </div>
            
            {/* My Local Feed PIP */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '200px', height: '150px', background: '#333', borderRadius: 'var(--radius-md)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>
              Local Camera
            </div>

            {/* Controls Bar */}
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '40px', display: 'flex', gap: '16px' }}>
              <button className="med-button" style={{ background: '#333', borderRadius: '50%', width: '44px', height: '44px', padding: 0 }}>🎤</button>
              <button className="med-button" style={{ background: '#333', borderRadius: '50%', width: '44px', height: '44px', padding: 0 }}>📹</button>
              <button className="med-button danger" style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0 }} onClick={endCall}>📞</button>
            </div>
          </div>

          {/* Sidebar / AI Tools during call */}
          {user?.role === 'doctor' && (
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="med-card" style={{ flex: 1, margin: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ fontSize: '1rem' }}>🤖 Live AI Diagnostic Notes</h3>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Listening for symptoms...
                  {simulatedTime > 10 && (
                    <div className="result-card urgency-medium" style={{ marginTop: '10px', animation: 'fadeSlideIn 0.3s ease' }}>
                      <strong>Detected:</strong> Patient mentioned "severe headache for 2 days".
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
