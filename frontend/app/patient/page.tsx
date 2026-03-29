'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bot, ClipboardList, User, FileText } from 'lucide-react';

export default function PatientDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Protect the route
  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== 'patient')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your dashboard...</div>;
  }

  return (
    <div className="animate-in">
      {/* Hero */}
      <div className="hero" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', padding: '40px', borderRadius: '24px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>
          Welcome back, {user.name}
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '800px', marginBottom: '24px' }}>
          Your integrated platform for personal medical management and AI-powered health diagnostics.
          Manage your profile, track your records, and get instant health assessments.
        </p>
        <div className="hero-actions" style={{ display: 'flex', gap: '16px' }}>
          <Link href="/symptom-checker" className="med-button" style={{ background: 'white', color: '#0ea5e9', fontWeight: 700, padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} /> AI Health Check
          </Link>
          <Link href="/patient/records" className="med-button" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600, padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} /> View Records
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stat-item" style={{ background: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>24/7</div>
          <div className="stat-label" style={{ color: '#64748b', fontSize: '0.9rem' }}>AI Diagnostics</div>
        </div>
        <div className="stat-item" style={{ background: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>13+</div>
          <div className="stat-label" style={{ color: '#64748b', fontSize: '0.9rem' }}>Medical Specialties</div>
        </div>
        <div className="stat-item" style={{ background: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>100%</div>
          <div className="stat-label" style={{ color: '#64748b', fontSize: '0.9rem' }}>Secure & Encrypted</div>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>
        Quick Access
      </h2>
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <Link href="/patient/profile" className="feature-card" style={{ background: 'white', padding: '24px', borderRadius: '20px', textDecoration: 'none', color: 'inherit', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
          <div className="feature-icon" style={{ background: '#e0f2fe', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#0ea5e9' }}><User size={24} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>My Profile</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Access patient profiles, medical history, and integrated healthcare coordination.</p>
        </Link>

        <Link href="/patient/records" className="feature-card" style={{ background: 'white', padding: '24px', borderRadius: '20px', textDecoration: 'none', color: 'inherit', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
          <div className="feature-icon" style={{ background: '#f0f9ff', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#0284c7' }}><FileText size={24} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Medical Records</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>View your treatment history, prescriptions, and securely upload important medical documents.</p>
        </Link>

        <Link href="/symptom-checker" className="feature-card" style={{ background: 'white', padding: '24px', borderRadius: '20px', textDecoration: 'none', color: 'inherit', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
          <div className="feature-icon" style={{ background: '#dcfce7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#16a34a' }}><Bot size={24} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>AI Symptom Checker</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Describe your symptoms and receive AI-powered specialist recommendations with urgency assessment.</p>
        </Link>
      </div>

      <footer style={{ marginTop: '60px', textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
        © 2026 MedSync Health Systems. All rights reserved.
      </footer>
    </div>
  );
}
