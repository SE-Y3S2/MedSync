'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { doctorApi, patientApi } from '../services/api';
import { ShieldBan, Users, UserCheck, Stethoscope, AlertTriangle, ArrowRight, ShieldCheck, Database, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingDoctors: 0,
    totalPatients: 0,
    systemStatus: 'Optimal'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // In a real app we might have a dedicated admin/stats endpoint
      const [doctors] = await Promise.all([
        doctorApi.listDoctors()
      ]);
      
      const drs = Array.isArray(doctors) ? doctors : [];
      
      setStats({
        totalDoctors: drs.length,
        pendingDoctors: drs.filter(d => !d.isVerified).length,
        totalPatients: 0, // In a high-perf app, patient counting would be a separate query
        systemStatus: 'Optimal'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <div className="animate-in" style={{ padding: '20px' }}>Loading...</div>;
  
  if (user?.role !== 'admin') {
    return (
      <div className="empty-state">
        <div className="empty-icon"><ShieldBan size={48} /></div>
        <h3>Access Denied</h3>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Admin Control Center</h1>
          <p className="page-subtitle">Platform-wide overview and infrastructure monitoring.</p>
        </div>
        <div className="badge low" style={{ background: 'var(--success-light)', color: 'var(--success)', fontWeight: 600 }}>
          System: {stats.systemStatus}
        </div>
      </div>

      <div className="stats-bar" style={{ marginBottom: '32px' }}>
        <div className="stat-item">
          <div className="stat-value">{stats.totalDoctors}</div>
          <div className="stat-label">Total Providers</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: stats.pendingDoctors > 0 ? 'var(--accent)' : 'inherit' }}>
            {stats.pendingDoctors}
          </div>
          <div className="stat-label">Pending Verifications</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">1</div>
          <div className="stat-label">Active Administrators</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="med-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div className="avatar sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
            <h3 className="card-title" style={{ margin: 0 }}>Doctor Management</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Verify medical licenses, manage provider specialties, and monitor professional credentials across the platform.
          </p>
          <Link href="/admin/doctors" className="med-button primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} /> Manage Doctors <ArrowRight size={16} />
          </Link>
        </div>

        <div className="med-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div className="avatar sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Database size={20} />
            </div>
            <h3 className="card-title" style={{ margin: 0 }}>System Infrastructure</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Monitor microservice health, inspect Kafka event logs, and manage centralized database clusters.
          </p>
          <button className="med-button secondary" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', opacity: 0.6 }}>
            <LayoutDashboard size={18} /> View Health Metrics (SOON)
          </button>
        </div>
      </div>
      
      {stats.pendingDoctors > 0 && (
        <div className="med-card" style={{ border: '1px solid var(--accent-light)', background: 'var(--accent-light)', color: 'var(--accent)', marginTop: '24px', opacity: 0.9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} />
            <div>
              <strong>Action Required:</strong> You have {stats.pendingDoctors} new doctor registration{stats.pendingDoctors > 1 ? 's' : ''} awaiting verification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
