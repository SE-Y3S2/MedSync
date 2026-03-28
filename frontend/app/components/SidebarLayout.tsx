'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastContainer } from './UI';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/appointment/search', label: 'Find Doctors', icon: '🔍' },
  { href: '/appointment', label: 'My Appointments', icon: '📅' },
  { href: '/patient/profile', label: 'My Profile', icon: '👤' },
  { href: '/patient/records', label: 'Records & Documents', icon: '📋' },
  { href: '/symptom-checker', label: 'AI Symptom Checker', icon: '🤖' },
];

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <ToastContainer />

      {/* Mobile toggle */}
      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '☰'}
      </button>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <h1>Med<span>Sync</span></h1>
            <p>Healthcare Platform</p>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            {user ? (
              <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  {user.firstName} {user.lastName}
                </p>
                <p style={{ marginBottom: '8px' }}>{user.email}</p>
                <button
                  onClick={logout}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    width: '100%'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '12px' }}>Not signed in</p>
                <Link href="/login" style={{ width: '100%', display: 'block' }}>
                  <button
                    style={{
                      background: 'var(--turquoise)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  >
                    Login / Join
                  </button>
                </Link>
              </div>
            )}
            <p style={{ marginTop: '12px' }}>© 2026 MedSync</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
