'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi } from '../../services/api';
import { MedCard as Card, MedInput as Input, MedButton as Button, showToast, Modal } from '../../components/UI';

export default function AvailabilityPage() {
  const { user, isLoading } = useAuth();
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    maxPatients: 5
  });

  useEffect(() => {
    if (user?.role === 'doctor') {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.getAvailability(user!.id);
      setAvailability(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      await doctorApi.addAvailability(user!.id, newSlot);
      showToast('Availability slot added!', 'success');
      setShowAddModal(false);
      loadAvailability();
    } catch (err) {
      showToast('Failed to add slot', 'error');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    try {
      await doctorApi.deleteAvailability(user!.id, slotId);
      showToast('Slot removed', 'info');
      loadAvailability();
    } catch (err) {
      showToast('Failed to remove slot', 'error');
    }
  };

  if (isLoading || loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (user?.role !== 'doctor') return <div style={{ padding: '20px' }}>Access Denied</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">My Schedule</h1>
          <p className="page-subtitle">Manage your weekly consultation availability slots.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon="+" variant="primary">
          Add New Slot
        </Button>
      </div>

      <div className="med-card">
        {availability.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No availability slots defined</h3>
            <p>Add your first weekly slot to start receiving appointments.</p>
            <Button onClick={() => setShowAddModal(true)} style={{ marginTop: '16px' }}>Define Availability</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {days.map(day => {
              const daySlots = availability.filter(s => s.day === day);
              if (daySlots.length === 0) return null;
              
              return (
                <div key={day} style={{ marginBottom: '16px' }}>
                  <h4 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--navy)' }}>
                    {day}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {daySlots.map(slot => (
                      <div key={slot._id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{slot.startTime} - {slot.endTime}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Max Patients: {slot.maxPatients}
                          </div>
                        </div>
                        <button 
                          className="med-button danger sm" 
                          onClick={() => handleDeleteSlot(slot._id)}
                          style={{ minWidth: 'auto', padding: '6px 10px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Availability Slot">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="med-input-group">
            <label className="med-label">Day of Week</label>
            <select 
              className="med-input" 
              value={newSlot.day} 
              onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
            >
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          <div className="grid-2">
            <Input 
              label="Start Time" 
              type="time" 
              value={newSlot.startTime} 
              onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} 
            />
            <Input 
              label="End Time" 
              type="time" 
              value={newSlot.endTime} 
              onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} 
            />
          </div>

          <Input 
            label="Max Patients per Session" 
            type="number" 
            value={newSlot.maxPatients.toString()} 
            onChange={(e) => setNewSlot({ ...newSlot, maxPatients: parseInt(e.target.value) || 1 })} 
          />

          <Button onClick={handleAddSlot} style={{ width: '100%', marginTop: '12px' }}>
            Save Availability Slot
          </Button>
        </div>
      </Modal>
    </div>
  );
}
