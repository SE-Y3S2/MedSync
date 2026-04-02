'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi, patientApi } from '../../services/api';
import { Modal, MedInput as Input, MedButton as Button, showToast } from '../../components/UI';
import { CheckCircle } from 'lucide-react';

export default function DoctorAppointments() {
  const { user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
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

  const handleViewRecords = async (patientId: string) => {
    setShowRecordsModal(true);
    setLoadingRecords(true);
    try {
      // Use the newly added patientApi methods
      const docs = await patientApi.getPatientDocuments(patientId);
      setPatientRecords(docs || []);
    } catch (err) {
      showToast('Failed to load patient records', 'error');
      setPatientRecords([]);
    } finally {
      setLoadingRecords(false);
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
      showToast('Failed to update status', 'error');
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="loading-spinner"></div>
    </div>
  );
  
  if (user?.role !== 'doctor') return <div>Access Denied</div>;

  return (
    <div className="animate-in max-w-6xl mx-auto py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Manage Appointments</h1>
        <p className="text-slate-500">Review, update, and manage your patient consultations.</p>
      </div>

      <div className="med-card">
        {appointments.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No appointments found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map(a => (
              <div key={a._id} className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 first:pt-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-slate-900 leading-none">{a.patientName}</h4>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                      a.status === 'confirmed' ? 'bg-blue-50 text-blue-600' : 
                      a.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-500">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                         🗓️ {new Date(a.slotDate).toLocaleDateString()} at {a.slotTime}
                      </div>
                      <div className="opacity-80">Reason: {a.reason || 'General Consultation'}</div>
                    </div>
                    <div className="space-y-1 border-l border-slate-100 pl-4">
                      <div className="font-medium text-slate-700">Payment: {a.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}</div>
                      <div className="opacity-80">Ref ID: {a._id.substring(0, 8)}...</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleViewRecords(a.patientId)}
                      className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      📘 View Medical Reports
                    </button>
                    {a.meetingLink && (
                       <Link 
                        href={`/telemedicine/${a._id}`}
                        className="text-xs font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
                       >
                         🎥 Join Video Consultation
                       </Link>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap lg:flex-nowrap gap-2 items-center justify-end">
                  {a.status === 'pending' && (
                    <>
                      <Button 
                        className="primary sm shadow-md" 
                        onClick={() => handleStatus(a._id, 'confirmed')}
                      >
                        Accept
                      </Button>
                      <Button 
                        className="danger sm" 
                        onClick={() => handleStatus(a._id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {a.status === 'confirmed' && (
                    <>
                      <Button 
                        className="primary sm shadow-md" 
                        onClick={() => handleOpenPrescription(a)}
                      >
                        Issue Prescription
                      </Button>
                      <Button 
                        className="secondary sm" 
                        onClick={() => handleStatus(a._id, 'completed', 'Consultation finished')}
                      >
                        Mark Completed
                      </Button>
                    </>
                  )}

                  {a.status === 'completed' && (
                    <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-50 px-4 py-2 rounded-xl text-sm">
                       <CheckCircle size={16} /> Consultation Handled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Records Modal */}
      <Modal 
        isOpen={showRecordsModal} 
        onClose={() => setShowRecordsModal(false)} 
        title="Patient Medical Reports"
      >
        <div className="min-h-[300px]">
          {loadingRecords ? (
            <div className="flex items-center justify-center h-full py-12">
               <div className="loading-spinner sm"></div>
            </div>
          ) : patientRecords.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-400">No medical reports found for this patient.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patientRecords.map((doc: any, i: number) => (
                <div key={i} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{doc.name || 'document_upload.pdf'}</div>
                    <div className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</div>
                  </div>
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="med-button sm secondary"
                    style={{ minWidth: 'auto', padding: '6px 12px' }}
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Prescription Modal */}
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
              style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
            >
              {isSubmitting ? 'Issuing...' : 'Issue Prescription & Finalize Consultation'}
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-spinner.sm {
          width: 24px;
          height: 24px;
          border-width: 3px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

