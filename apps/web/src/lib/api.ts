import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dentflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dentflow_token');
        localStorage.removeItem('dentflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  createUser: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
};

export const patientApi = {
  getAll: (params?: { query?: string; page?: number; limit?: number }) =>
    api.get('/patients', { params }),
  autocomplete: (q: string) => api.get('/patients/autocomplete', { params: { q } }),
  getOne: (id: string) => api.get(`/patients/${id}`),
  create: (data: Record<string, unknown>) => api.post('/patients', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/patients/${id}`, data),
  archive: (id: string) => api.patch(`/patients/${id}/archive`),
  getQR: (id: string) => api.get(`/patients/qr/${id}`),
  scan: (patientId: string) => api.get(`/patients/scan/${patientId}`),
  getStats: () => api.get('/patients/stats'),
};

export const appointmentApi = {
  getAll: (params?: {
    date?: string;
    doctorId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/appointments', { params }),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  create: (data: Record<string, unknown>) => api.post('/appointments', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/appointments/${id}`, data),
  getQueue: (doctorId?: string, date?: string) =>
    api.get('/appointments/queue', { params: { doctorId, date } }),
  getStats: () => api.get('/appointments/stats'),
};

export const treatmentApi = {
  getAll: (params?: {
    patientId?: string;
    doctorId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/treatments', { params }),
  getOne: (id: string) => api.get(`/treatments/${id}`),
  create: (data: Record<string, unknown>) => api.post('/treatments', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/treatments/${id}`, data),
  getPatientHistory: (patientId: string) =>
    api.get(`/treatments/patient/${patientId}`),
  getStats: () => api.get('/treatments/stats'),
};

export const labApi = {
  getAll: (params?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/lab-cases', { params }),
  getOne: (id: string) => api.get(`/lab-cases/${id}`),
  create: (data: Record<string, unknown>) => api.post('/lab-cases', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/lab-cases/${id}`, data),
  getStats: () => api.get('/lab-cases/stats'),
};

export const fileApi = {
  getAll: (params?: {
    patientId?: string;
    treatmentId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => api.get('/files', { params }),
  getOne: (id: string) => api.get(`/files/${id}`),
  create: (data: Record<string, unknown>) => api.post('/files', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/files/${id}`, data),
  delete: (id: string) => api.delete(`/files/${id}`),
  download: (id: string) => api.get(`/files/${id}/download`),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics'),
  getPatientGrowth: (period?: 'week' | 'month') =>
    api.get('/analytics/patient-growth', { params: { period } }),
  getRevenue: (period?: 'week' | 'month') =>
    api.get('/analytics/revenue', { params: { period } }),
};

export const doctorApi = {
  getAll: (params?: { query?: string; page?: number; limit?: number }) =>
    api.get('/doctors', { params }),
  getOne: (id: string) => api.get(`/doctors/${id}`),
  create: (data: Record<string, unknown>) => api.post('/doctors', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/doctors/${id}`, data),
  archive: (id: string) => api.patch(`/doctors/${id}/archive`),
};

export const billingApi = {
  getInvoices: (params?: {
    patientId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/billing/invoices', { params }),
  getOne: (id: string) => api.get(`/billing/invoices/${id}`),
  create: (data: Record<string, unknown>) => api.post('/billing/invoices', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/billing/invoices/${id}`, data),
  addPayment: (invoiceId: string, data: Record<string, unknown>) =>
    api.post(`/billing/invoices/${invoiceId}/payments`, data),
  getStats: () => api.get('/billing/invoices/stats'),
};

export const medicalHistoryApi = {
  getByPatient: (patientId: string) => api.get(`/medical-history/patient/${patientId}`),
  create: (data: Record<string, unknown>) => api.post('/medical-history', data),
  update: (patientId: string, data: Record<string, unknown>) =>
    api.put(`/medical-history/patient/${patientId}`, data),
  delete: (patientId: string) => api.delete(`/medical-history/patient/${patientId}`),
};

export const chiefComplaintApi = {
  getByPatient: (patientId: string) => api.get(`/chief-complaints/patient/${patientId}`),
  create: (data: Record<string, unknown>) => api.post('/chief-complaints', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/chief-complaints/${id}`, data),
  delete: (id: string) => api.delete(`/chief-complaints/${id}`),
};

export const oralExaminationApi = {
  getByPatient: (patientId: string) => api.get(`/oral-examinations/patient/${patientId}`),
  getLatest: (patientId: string) => api.get(`/oral-examinations/patient/${patientId}/latest`),
  create: (data: Record<string, unknown>) => api.post('/oral-examinations', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/oral-examinations/${id}`, data),
  addFinding: (id: string, data: Record<string, unknown>) =>
    api.post(`/oral-examinations/${id}/findings`, data),
  delete: (id: string) => api.delete(`/oral-examinations/${id}`),
};

export const treatmentPlanApi = {
  getByPatient: (patientId: string) => api.get(`/treatment-plans/patient/${patientId}`),
  getOne: (id: string) => api.get(`/treatment-plans/${id}`),
  create: (data: Record<string, unknown>) => api.post('/treatment-plans', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/treatment-plans/${id}`, data),
  addProcedure: (id: string, data: Record<string, unknown>) =>
    api.post(`/treatment-plans/${id}/procedures`, data),
  updateProcedure: (procedureId: string, data: Record<string, unknown>) =>
    api.put(`/treatment-plans/procedures/${procedureId}`, data),
  delete: (id: string) => api.delete(`/treatment-plans/${id}`),
};

export const aiApi = {
  chat: (data: {
    message: string;
    sessionId?: string;
    action?: string;
  }) => api.post('/ai/chat', data),
};