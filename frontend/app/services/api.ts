const PATIENT_SERVICE_URL = process.env.NEXT_PUBLIC_PATIENT_SERVICE_URL || 'http://localhost:3001/api/patients';
const SYMPTOM_CHECKER_URL = process.env.NEXT_PUBLIC_SYMPTOM_CHECKER_URL || 'http://localhost:3007/api/symptom-checker';

// ── Auth Helper ──
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medsync_token') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getAuthHeadersNoContentType = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medsync_token') : null;
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ── Patient API ──
export const patientApi = {
  // Profile
  getProfile: async () => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/profile`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  updateProfile: async (data: any) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Records
  getRecords: async () => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/records`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch records');
    return response.json();
  },

  addMedicalRecord: async (data: any) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/records/history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add medical record');
    return response.json();
  },

  addPrescription: async (data: any) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/records/prescriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add prescription');
    return response.json();
  },

  // Documents
  uploadDocument: async (formData: FormData) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeadersNoContentType(),
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return response.json();
  },

  getDocuments: async () => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/documents`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  deleteDocument: async (docId: string) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/documents/${docId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete document');
    return response.json();
  }
};

// ── Symptom Checker API ──
export const symptomApi = {
  analyzeSymptoms: async (symptoms: string, patientId?: string) => {
    const response = await fetch(`${SYMPTOM_CHECKER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, patientId })
    });
    if (!response.ok) throw new Error('Failed to analyze symptoms');
    return response.json();
  },

  getHistory: async (patientId: string) => {
    const response = await fetch(`${SYMPTOM_CHECKER_URL}/history/${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch symptom history');
    return response.json();
  }
};

// ── My Extensions (Additions Only) ──
const DOCTOR_SERVICE_URL = process.env.NEXT_PUBLIC_DOCTOR_SERVICE_URL || 'http://localhost:3002/api/doctors';
const APPOINTMENT_SERVICE_URL = process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL || 'http://localhost:3003/api/appointments';
const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3005/api/payments';

export const doctorApi = {
  listDoctors: async (specialty?: string) => {
    const baseUrl = `${APPOINTMENT_SERVICE_URL}/search-doctors`;
    const url = specialty ? `${baseUrl}?specialty=${encodeURIComponent(specialty)}` : baseUrl;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    return response.json();
  },
  getDoctor: async (id: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/search-doctors/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch doctor details');
    return response.json();
  }
};

export const appointmentApi = {
  createAppointment: async (data: any) => {
    const response = await fetch(APPOINTMENT_SERVICE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to book appointment');
    return response.json();
  },
  getPatientAppointments: async (patientId: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/patient/${patientId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },
  cancelAppointment: async (id: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to cancel appointment');
    return response.json();
  }
};

export const paymentApi = {
  createCheckoutSession: async (data: { appointmentId: string; patientId: string; doctorId: string; doctorName: string; amount: number }) => {
    const response = await fetch(`${PAYMENT_SERVICE_URL}/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create payment session');
    return response.json();
  }
};
