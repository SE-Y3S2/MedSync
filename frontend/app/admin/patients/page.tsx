'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientApi } from '../../services/api';
import { ShieldBan, RefreshCcw, Search, Users, Mail, Phone } from 'lucide-react';

interface PatientRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt: string;
}

export default function AdminManagePatients() {
  const { user, isLoading } = useAuth();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await patientApi.listAllPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="animate-in" style={{ padding: '20px' }}>Loading...</div>;

  if (user?.role !== 'admin') {
    return (
      <div className="empty-state">
        <div className="empty-icon"><ShieldBan size={48} /></div>
        <h3>Access Denied</h3>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Manage Patients</h1>
          <p className="page-subtitle">All registered patients on the platform ({patients.length} total).</p>
        </div>
        <button className="med-button secondary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="med-card" style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="med-input"
            style={{ paddingLeft: '40px', marginBottom: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="med-card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px' }}>
            <div className="empty-icon"><Users size={40} /></div>
            <h3>No patients found</h3>
            <p>{search ? 'No matches for your search.' : 'No patients have registered yet.'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left' }}>
                <th style={{ padding: '16px', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Contact</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Demographics</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {p._id.substring(0, 8)}…</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <Mail size={14} /> {p.email}
                    </div>
                    {p.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <Phone size={14} /> {p.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {p.gender || '—'} {p.dateOfBirth ? `• DOB ${new Date(p.dateOfBirth).toLocaleDateString()}` : ''}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
