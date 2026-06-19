import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to attach JWT token to outgoing headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: async (formData: FormData) => {
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  signup: async (data: any) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateMe: async (data: any) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (data: any) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }
};

export const patientAPI = {
  list: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get('/patients/', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/patients/', data);
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  getScans: async (id: string) => {
    const response = await api.get(`/patients/${id}/scans`);
    return response.data;
  },
  delete: async (id: string) => {
     const response = await api.delete(`/patients/${id}`);
     return response.data;
  }
};

export const scanAPI = {
  upload: async (file: File, patientId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    const response = await api.post('/scans/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  diagnose: async (id: string) => {
    const response = await api.post(`/scans/${id}/diagnose`);
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/scans/${id}`);
    return response.data;
  },
  list: async () => {
    const response = await api.get('/scans/');
    return response.data;
  }
};

export const reportAPI = {
  getPdfUrl: (scanId: string) => `${API_URL}/reports/${scanId}/pdf`,
  getCsvUrl: (scanId: string) => `${API_URL}/reports/${scanId}/csv`,
};

export const modelAPI = {
  list: async () => {
    const response = await api.get('/models/');
    return response.data;
  },
  promote: async (id: string, stage: string) => {
    const response = await api.post(`/models/${id}/promote`, { stage });
    return response.data;
  },
  getExperiments: async () => {
    const response = await api.get('/models/experiments');
    return response.data;
  },
  triggerTraining: async () => {
    const response = await api.post('/models/train/trigger');
    return response.data;
  }
};

export const datasetAPI = {
  getStats: async () => {
    const response = await api.get('/datasets/stats');
    return response.data;
  },
  upload: async (file: File, note: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version_note', note);
    const response = await api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

export const monitoringAPI = {
  getMetrics: async () => {
    const response = await api.get('/monitoring/metrics');
    return response.data;
  }
};

export const auditAPI = {
  list: async () => {
    const response = await api.get('/audit/');
    return response.data;
  }
};
