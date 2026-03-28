'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="animate-in">
      {/* Hero */}
      <div className="hero">
        <h1>
          {user ? `Welcome back, ${user.name}` : 'Welcome to MedSync'}
        </h1>
        <p>
          Your integrated platform for personal medical management and AI-powered health diagnostics.
          Manage your profile, track your records, and get instant health assessments.
        </p>
        <div className="hero-actions">
          <Link href="/symptom-checker" className="med-button primary" style={{ textDecoration: 'none' }}>
            🤖 AI Health Check
          </Link>
          <Link href="/patient/records" className="med-button secondary" style={{ textDecoration: 'none' }}>
            📋 View Records
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">24/7</div>
          <div className="stat-label">AI Diagnostics</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">13+</div>
          <div className="stat-label">Medical Specialties</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">Secure & Encrypted</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">5MB</div>
          <div className="stat-label">Max Upload Size</div>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
        Quick Access
      </h2>
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <Link href="/patient/profile" className="feature-card">
          <div className="feature-icon blue">👤</div>
          <h3>Patient Operations</h3>
          <p>Access patient profiles, medical history, and integrated healthcare coordination.</p>
        </Link>

        <Link href="/patient/records" className="feature-card">
          <div className="feature-icon teal">📋</div>
          <h3>Medical Records</h3>
          <p>View your treatment history, prescriptions, and securely upload important medical documents.</p>
        </Link>

        <Link href="/symptom-checker" className="feature-card">
          <div className="feature-icon green">🤖</div>
          <h3>AI Symptom Checker</h3>
          <p>Describe your symptoms and receive AI-powered specialist recommendations with urgency assessment.</p>
        </Link>
      </div>

      {/* Information section */}
      <div className="med-card" style={{ marginTop: '36px' }}>
        <h3 className="card-title">
          <span className="card-icon">🔒</span>
          Secure & Integrated Architecture
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          MedSync uses a microservices architecture with event-driven communication via Apache Kafka.
          Each service runs independently with dedicated databases, ensuring data isolation, scalability,
          and high availability. All patient data is securely stored and accessible only through authenticated APIs.
        </p>
      </div>

      <footer style={{ marginTop: '40px', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © 2026 MedSync Health Systems. All rights reserved.
      </footer>
    </div>
  );
}
