'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../services/api';
import { ShieldBan } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDoctors();
    }
  }, [user]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.listDoctors();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await doctorApi.updateDoctor(id, { isVerified });
      // Refresh list
      loadDoctors();
    } catch (err) {
      alert('Failed to update doctor verification status');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  
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
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Manage platform operations and verify doctors.</p>

      <div className="med-card">
        <h3 className="card-title">Doctor Registrations</h3>
        {loading ? (
          <div>Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <p>No doctors registered yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Name</th>
                <th style={{ padding: '12px 8px' }}>Specialty</th>
                <th style={{ padding: '12px 8px' }}>Email</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doc => (
                <tr key={doc._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '16px 8px' }}>{doc.name}</td>
                  <td style={{ padding: '16px 8px' }}>{doc.specialty}</td>
                  <td style={{ padding: '16px 8px' }}>{doc.contact?.email}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span className={`badge ${doc.isVerified ? 'low' : 'high'}`}>
                      {doc.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    {!doc.isVerified ? (
                      <button 
                        className="med-button primary sm"
                        onClick={() => handleVerify(doc._id, true)}
                      >
                        Verify
                      </button>
                    ) : (
                      <button 
                        className="med-button secondary sm"
                        onClick={() => handleVerify(doc._id, false)}
                      >
                        Revoke
                      </button>
                    )}
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
