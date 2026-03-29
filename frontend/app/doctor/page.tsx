'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { doctorApi, appointmentApi } from '../services/api';
import { Clock, Video } from 'lucide-react';

export default function DoctorDashboard() {
  const { user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorDetails, setDoctorDetails] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'doctor') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [appts, docInfo] = await Promise.all([
        appointmentApi.getDoctorAppointments(user!.id),
        doctorApi.getDoctor(user!.id)
      ]);
      setAppointments(appts || []);
      setDoctorDetails(docInfo);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (user?.role !== 'doctor') return <div>Access Denied</div>;

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');

  return (
    <div className="animate-in">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="avatar lg">
          {user.name.charAt(0)}
        </div>
        <div className="profile-info">
          <h2>Dr. {user.name}</h2>
          <p>{doctorDetails?.specialty || 'Specialist'}</p>
          {!doctorDetails?.isVerified && (
            <span className="badge high" style={{ marginTop: '8px', display: 'inline-block' }}>Verification Pending</span>
          )}
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">Pending Requests</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{confirmed.length}</div>
          <div className="stat-label">Upcoming Appointments</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="med-card">
          <h3 className="card-title">Pending Requests</h3>
          {pending.length === 0 ? <p>No pending appointment requests.</p> : (
            pending.slice(0, 3).map(a => (
              <div key={a._id} className="history-item">
                <div style={{ fontWeight: 600 }}>{a.patientName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(a.slotDate).toLocaleDateString()} at {a.slotTime}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Link href="/doctor/appointments" className="med-button primary sm">
                    Review
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="med-card">
          <h3 className="card-title">Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/doctor/appointments" className="med-button primary" style={{ justifyContent: 'center' }}>
              Manage Appointments
            </Link>
            <Link href="/doctor/availability" className="med-button secondary" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> Configure My Schedule
            </Link>
            <Link href="/telemedicine" className="med-button primary" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={16} /> Start Telemedicine Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
