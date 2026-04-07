const PATIENT_SERVICE_URL = process.env.NEXT_PUBLIC_PATIENT_SERVICE_URL || 'http://localhost:3001/api/patients';
const SYMPTOM_CHECKER_URL = process.env.NEXT_PUBLIC_SYMPTOM_CHECKER_URL || 'http://localhost:3007/api/symptom-checker';
const TELEMEDICINE_SERVICE_URL = process.env.NEXT_PUBLIC_TELEMEDICINE_SERVICE_URL || 'http://localhost:3004/api/sessions';

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

// ── Auth Helper ──
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined'
    ? (getCookie('medsync_token') || localStorage.getItem('medsync_token'))
    : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getAuthHeadersNoContentType = (): HeadersInit => {
  const token = typeof window !== 'undefined'
    ? (getCookie('medsync_token') || localStorage.getItem('medsync_token'))
    : null;
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ── Patient API ──
export const patientApi = {
  // Auth
  login: async (data: any) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Invalid patient credentials');
    return response.json();
  },
  register: async (data: any) => {
    const { role: _role, ...payload } = data;
    const response = await fetch(`${PATIENT_SERVICE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let message = 'Failed to register patient';
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.json();
  },

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
  doctorIssuePrescription: async (patientId: string, data: any) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/${patientId}/prescriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to issue prescription');
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
  },

  // For Doctors to review (Kaveen's part)
  getPatientRecords: async (patientId: string) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/${patientId}/records`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch patient records');
    return response.json();
  },

  getPatientDocuments: async (patientId: string) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/${patientId}/documents`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch patient documents');
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
  },
  updateDoctor: async (id: string, data: any) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update doctor');
    return response.json();
  },
  login: async (data: any) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Invalid doctor credentials');
    return response.json();
  },
  register: async (data: any) => {
    const { role: _role, ...payload } = data;
    const response = await fetch(`${DOCTOR_SERVICE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let message = 'Failed to register doctor';
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.json();
  },
  getAvailability: async (id: string) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/${id}/availability`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json();
  },
  addAvailability: async (id: string, data: any) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/${id}/availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add slot');
    return response.json();
  },
  deleteAvailability: async (id: string, slotId: string) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/${id}/availability/${slotId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete slot');
    return response.json();
  },
  getAnalytics: async (id: string) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/${id}/analytics`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },
  issuePrescription: async (data: any) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/prescriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to issue prescription');
    return response.json();
  },
  verifyPrescription: async (verificationId: string) => {
    const response = await fetch(`${DOCTOR_SERVICE_URL}/prescriptions/verify/${verificationId}`);
    if (!response.ok) throw new Error('Prescription not found or invalid');
    return response.json();
  }
};

export const adminApi = {
  login: async (data: any) => {
    const response = await fetch(`${PATIENT_SERVICE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Invalid admin credentials');
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
  getAppointment: async (id: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch appointment');
    return response.json();
  },
  getPatientAppointments: async (patientId: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/patient/${patientId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },
  getDoctorAppointments: async (doctorId: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/doctor/${doctorId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch doctor appointments');
    return response.json();
  },
  getBookedSlots: async (doctorId: string, date: string) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/available-slots/${doctorId}?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch booked slots');
    return response.json();
  },
  updateStatus: async (id: string, data: { status: string; cancelledBy?: string; cancellationReason?: string; notes?: string }) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },
  cancelAppointment: async (id: string, data?: { cancelledBy: string; cancellationReason?: string }) => {
    const response = await fetch(`${APPOINTMENT_SERVICE_URL}/${id}/cancel`, { 
      method: 'PUT', 
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}) 
    });
    if (!response.ok) throw new Error('Failed to cancel appointment');
    return response.json();
  },
  adminGetAllAppointments: async () => {
    const response = await fetch(APPOINTMENT_SERVICE_URL, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch all appointments');
    return response.json();
  }
};

export const telemedicineApi = {
  createSession: async (data: { appointmentId: string; doctorId: string; patientId: string }) => {
    const response = await fetch(TELEMEDICINE_SERVICE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  },
  getSession: async (appointmentId: string) => {
    const response = await fetch(`${TELEMEDICINE_SERVICE_URL}/${appointmentId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  },
  endSession: async (appointmentId: string) => {
    const response = await fetch(`${TELEMEDICINE_SERVICE_URL}/${appointmentId}/end`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to end session');
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
  },
  getPatientPayments: async (patientId: string) => {
    const response = await fetch(`${PAYMENT_SERVICE_URL}/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch payment history');
    return response.json();
  },
  adminGetAllPayments: async () => {
    const response = await fetch(PAYMENT_SERVICE_URL, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch all system payments');
    return response.json();
  }
};
