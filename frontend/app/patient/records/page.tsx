'use client';

import React, { useState, useEffect, useRef } from 'react';
import { patientApi, PATIENT_API_BASE } from '../../services/api';

// Derive the patient-service origin from the API base so uploaded documents
// resolve relative to the service, not the frontend host.
const PATIENT_SERVICE_ORIGIN = (() => {
  try {
    return new URL(PATIENT_API_BASE).origin;
  } catch {
    return 'http://localhost:3001';
  }
})();
import { Card, Button, Tabs, Badge, showToast, Modal } from '../../components/UI';

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [records, setRecords] = useState<any>({ medicalHistory: [], prescriptions: [] });
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Report');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [newRecord, setNewRecord] = useState({ description: '', diagnosis: '', doctor: '', notes: '' });
  const [newPrescription, setNewPrescription] = useState({ medication: '', dosage: '', frequency: '', duration: '', instructions: '', prescribedBy: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const recs = await patientApi.getRecords();
      setRecords(recs);
      const docs = await patientApi.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // File upload handler
  const handleUpload = async (file?: File) => {
    const uploadFile = file || selectedFile;
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('type', docType);

    try {
      await patientApi.uploadDocument(formData);
      fetchData();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Document uploaded successfully!', 'success');
    } catch (error) {
      showToast('Error uploading document.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await patientApi.deleteDocument(docId);
      fetchData();
      showToast('Document deleted.', 'info');
    } catch (error) {
      showToast('Error deleting document.', 'error');
    }
  };

  // Add medical record
  const handleAddRecord = async () => {
    if (!newRecord.description) return showToast('Description is required.', 'warning');
    try {
      await patientApi.addMedicalRecord(newRecord);
      setNewRecord({ description: '', diagnosis: '', doctor: '', notes: '' });
      setShowAddRecord(false);
      fetchData();
      showToast('Medical record added!', 'success');
    } catch (error) {
      showToast('Error adding record.', 'error');
    }
  };

  // Add prescription
  const handleAddPrescription = async () => {
    if (!newPrescription.medication || !newPrescription.dosage) return showToast('Medication and dosage are required.', 'warning');
    try {
      await patientApi.addPrescription(newPrescription);
      setNewPrescription({ medication: '', dosage: '', frequency: '', duration: '', instructions: '', prescribedBy: '' });
      setShowAddPrescription(false);
      fetchData();
      showToast('Prescription added!', 'success');
    } catch (error) {
      showToast('Error adding prescription.', 'error');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'Report': return '📄';
      case 'Scan': return '🩻';
      case 'Prescription': return '💊';
      case 'Lab Result': return '🔬';
      default: return '📎';
    }
  };

  return (
    <div className="animate-in">
      <h1 className="page-title">Medical Records & Documents</h1>
      <p className="page-subtitle">View your treatment history, prescriptions, and manage uploaded documents</p>

      <Tabs
        tabs={['📋 Medical History', '💊 Prescriptions', '📁 Documents']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="tab-content">
        {/* ── Medical History Tab ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Treatment History</h2>
              <Button onClick={() => setShowAddRecord(true)} icon="+" variant="secondary" size="sm">
                Add Record
              </Button>
            </div>

            {records.medicalHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Medical History</h3>
                <p>Your treatment records will appear here once added by you or your doctor.</p>
              </div>
            ) : (
              records.medicalHistory.map((item: any, idx: number) => (
                <div key={idx} className="history-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1rem' }}>{item.description}</strong>
                      {item.diagnosis && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Diagnosis: {item.diagnosis}</p>}
                      {item.doctor && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Doctor: {item.doctor}</p>}
                      {item.notes && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>{item.notes}</p>}
                    </div>
                    <Badge text={new Date(item.date).toLocaleDateString()} variant="info" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Prescriptions Tab ── */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Prescriptions</h2>
              <Button onClick={() => setShowAddPrescription(true)} icon="+" variant="secondary" size="sm">
                Add Prescription
              </Button>
            </div>

            {records.prescriptions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💊</div>
                <h3>No Prescriptions</h3>
                <p>Your prescriptions from doctors will appear here.</p>
              </div>
            ) : (
              records.prescriptions.map((item: any, idx: number) => (
                <div key={idx} className="history-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1rem' }}>{item.medication}</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dosage: {item.dosage}</p>
                      {item.frequency && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Frequency: {item.frequency}</p>}
                      {item.duration && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duration: {item.duration}</p>}
                      {item.instructions && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>{item.instructions}</p>}
                      {item.prescribedBy && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>By: {item.prescribedBy}</p>}
                      
                      <a 
                        href={`/verify/${item.verificationId || 'missing'}`} 
                        target="_blank"
                        className={`med-link ${!item.verificationId ? 'disabled' : ''}`}
                        style={{ 
                          fontSize: '0.75rem', 
                          color: item.verificationId ? '#3b82f6' : '#94a3b8', 
                          fontWeight: 700, 
                          textDecoration: 'none',
                          marginTop: '10px',
                          display: 'inline-block',
                          pointerEvents: item.verificationId ? 'auto' : 'none'
                        }}
                      >
                        {item.verificationId ? 'VIEW DIGITAL COPY & QR →' : 'PAPER-ONLY RECORD'}
                      </a>
                    </div>
                    <Badge text={new Date(item.date).toLocaleDateString()} variant="info" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === 2 && (
          <div>
            <Card title="Upload Medical Documents" icon="📤">
              {/* Document Type */}
              <div className="med-input-group">
                <label className="med-label">Document Type</label>
                <select
                  className="med-input"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="Report">Report</option>
                  <option value="Scan">Scan</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Lab Result">Lab Result</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Drag & Drop Zone */}
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📎</div>
                {selectedFile ? (
                  <p><strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                ) : (
                  <>
                    <p><strong>Click to browse</strong> or drag & drop your file here</p>
                    <p className="upload-hint">Supports PDF, JPG, PNG (max 5MB)</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />

              <div style={{ marginTop: '16px' }}>
                <Button
                  onClick={() => handleUpload()}
                  disabled={uploading || !selectedFile}
                  icon={uploading ? '⏳' : '📤'}
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </Card>

            <Card title="Your Documents" icon="📁">
              {documents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h3>No Documents</h3>
                  <p>Upload your medical reports, scans, and prescriptions above.</p>
                </div>
              ) : (
                documents.map((doc: any, idx: number) => (
                  <div key={idx} className="doc-item">
                    <div className="doc-item-info">
                      <div className="doc-type-icon">{getDocTypeIcon(doc.type)}</div>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{doc.fileName}</strong>
                        <br />
                        <small style={{ color: 'var(--text-muted)' }}>
                          {doc.type} • {new Date(doc.uploadDate).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <div className="doc-item-actions">
                      <a
                        href={
                          doc.verificationId 
                            ? `/verify/${doc.verificationId}` 
                            : `${process.env.NEXT_PUBLIC_PATIENT_SERVICE_URL?.replace('/api/patients', '') || 'http://localhost:3001'}/${doc.fileUrl?.replace(/\\/g, '/')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="med-button secondary sm"
                        style={{ textDecoration: 'none' }}
                      >
                        View
                      </a>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteDoc(doc._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ── Add Medical Record Modal ── */}
      <Modal isOpen={showAddRecord} onClose={() => setShowAddRecord(false)} title="Add Medical Record">
        <div className="med-input-group">
          <label className="med-label">Description *</label>
          <input className="med-input" value={newRecord.description} onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })} placeholder="e.g., Annual checkup" />
        </div>
        <div className="med-input-group">
          <label className="med-label">Diagnosis</label>
          <input className="med-input" value={newRecord.diagnosis} onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })} placeholder="e.g., Mild hypertension" />
        </div>
        <div className="med-input-group">
          <label className="med-label">Doctor</label>
          <input className="med-input" value={newRecord.doctor} onChange={(e) => setNewRecord({ ...newRecord, doctor: e.target.value })} placeholder="Doctor name" />
        </div>
        <div className="med-input-group">
          <label className="med-label">Notes</label>
          <textarea className="med-input" value={newRecord.notes} onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} placeholder="Additional notes" rows={3} />
        </div>
        <Button onClick={handleAddRecord} icon="💾">Save Record</Button>
      </Modal>

      {/* ── Add Prescription Modal ── */}
      <Modal isOpen={showAddPrescription} onClose={() => setShowAddPrescription(false)} title="Add Prescription">
        <div className="grid-2">
          <div className="med-input-group">
            <label className="med-label">Medication *</label>
            <input className="med-input" value={newPrescription.medication} onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })} placeholder="Drug name" />
          </div>
          <div className="med-input-group">
            <label className="med-label">Dosage *</label>
            <input className="med-input" value={newPrescription.dosage} onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })} placeholder="e.g., 500mg" />
          </div>
        </div>
        <div className="grid-2">
          <div className="med-input-group">
            <label className="med-label">Frequency</label>
            <input className="med-input" value={newPrescription.frequency} onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })} placeholder="e.g., Twice daily" />
          </div>
          <div className="med-input-group">
            <label className="med-label">Duration</label>
            <input className="med-input" value={newPrescription.duration} onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })} placeholder="e.g., 7 days" />
          </div>
        </div>
        <div className="med-input-group">
          <label className="med-label">Instructions</label>
          <textarea className="med-input" value={newPrescription.instructions} onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })} placeholder="Special instructions" rows={2} />
        </div>
        <div className="med-input-group">
          <label className="med-label">Prescribed By</label>
          <input className="med-input" value={newPrescription.prescribedBy} onChange={(e) => setNewPrescription({ ...newPrescription, prescribedBy: e.target.value })} placeholder="Doctor name" />
        </div>
        <Button onClick={handleAddPrescription} icon="💾">Save Prescription</Button>
      </Modal>
    </div>
  );
}
