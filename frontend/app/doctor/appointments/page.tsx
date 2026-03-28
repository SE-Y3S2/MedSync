'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi, patientApi } from '../../services/api';
import { Modal, MedInput as Input, MedButton as Button, showToast } from '../../components/UI';

export default function DoctorAppointments() {
  const { user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'doctor') {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const data = await appointmentApi.getDoctorAppointments(user!.id);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatus = async (id: string, status: string, notes?: string) => {
    try {
      if (status === 'rejected' || status === 'cancelled') {
        await appointmentApi.cancelAppointment(id, { cancelledBy: 'doctor', cancellationReason: notes });
      } else {
        await appointmentApi.updateStatus(id, { status, notes });
      }
      loadAppointments();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleOpenPrescription = (appt: any) => {
    setSelectedAppointment(appt);
    setShowPrescriptionModal(true);
  };

  const handleIssuePrescription = async () => {
    if (!selectedAppointment) return;
    if (!prescriptionData.medication || !prescriptionData.dosage) {
      showToast('Medication and dosage are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await patientApi.doctorIssuePrescription(selectedAppointment.patientId, {
        ...prescriptionData,
        prescribedBy: user?.name,
        date: new Date()
      });
      showToast('Prescription issued successfully!', 'success');
      setShowPrescriptionModal(false);
      setPrescriptionData({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });
      
      // Auto-complete the appointment if confirmed
      if (selectedAppointment.status === 'confirmed') {
        await handleStatus(selectedAppointment._id, 'completed', 'Prescription issued');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to issue prescription', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (user?.role !== 'doctor') return <div>Access Denied</div>;

  return (
    <div className="animate-in">
      <h1 className="page-title">Manage Appointments</h1>
      <p className="page-subtitle">Review and update the status of your patient appointments.</p>

      <div className="med-card">
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appointments.map(a => (
              <div key={a._id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{a.patientName}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(a.slotDate).toLocaleDateString()} at {a.slotTime}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Reason: {a.reason || 'N/A'} • Payment: {a.paymentStatus}
                  </div>
                  <span className={`badge ${a.status === 'confirmed' ? 'low' : a.status === 'pending' ? 'medium' : 'high'}`} style={{ marginTop: '8px' }}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
                
                {a.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="med-button primary sm" 
                      onClick={() => handleStatus(a._id, 'confirmed')}
                    >
                      Accept
                    </button>
                    <button 
                      className="med-button danger sm" 
                      onClick={() => handleStatus(a._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                {a.status === 'confirmed' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="med-button primary sm" 
                      onClick={() => handleOpenPrescription(a)}
                    >
                      Issue Prescription
                    </button>
                    <button 
                      className="med-button secondary sm" 
                      onClick={() => handleStatus(a._id, 'completed', 'Consultation finished')}
                    >
                      Mark Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={showPrescriptionModal} 
        onClose={() => setShowPrescriptionModal(false)} 
        title={`Issue Prescription for ${selectedAppointment?.patientName}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input 
            label="Medication Name" 
            value={prescriptionData.medication} 
            onChange={(e) => setPrescriptionData({ ...prescriptionData, medication: e.target.value })} 
            placeholder="e.g. Paracetamol" 
            required 
          />
          <div className="grid-2">
            <Input 
              label="Dosage" 
              value={prescriptionData.dosage} 
              onChange={(e) => setPrescriptionData({ ...prescriptionData, dosage: e.target.value })} 
              placeholder="e.g. 500mg" 
              required 
            />
            <Input 
              label="Frequency" 
              value={prescriptionData.frequency} 
              onChange={(e) => setPrescriptionData({ ...prescriptionData, frequency: e.target.value })} 
              placeholder="e.g. Twice daily" 
            />
          </div>
          <Input 
            label="Duration" 
            value={prescriptionData.duration} 
            onChange={(e) => setPrescriptionData({ ...prescriptionData, duration: e.target.value })} 
            placeholder="e.g. 5 days" 
          />
          <div className="med-input-group">
            <label className="med-label">Instructions</label>
            <textarea 
              className="med-input" 
              value={prescriptionData.instructions} 
              onChange={(e) => setPrescriptionData({ ...prescriptionData, instructions: e.target.value })} 
              placeholder="e.g. After meals" 
              rows={3} 
            />
          </div>
          <div style={{ marginTop: '12px' }}>
            <Button 
              onClick={handleIssuePrescription} 
              disabled={isSubmitting} 
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Issuing...' : 'Issue Prescription & Complete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
