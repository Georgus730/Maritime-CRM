import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maritimecrm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('maritimecrm_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard
export const getDashboardStats = () => api.get('/api/dashboard/stats');
export const getExpiringDocuments = () => api.get('/api/dashboard/expiring-documents');
export const getUpcomingRotations = () => api.get('/api/dashboard/upcoming-rotations');
export const getRecentSailors = (limit = 5) => api.get(`/api/dashboard/recent-sailors?limit=${limit}`);

// Sailors
export const getSailors = (params = {}) => api.get('/api/sailors', { params });
export const getSailor = (id) => api.get(`/api/sailors/${id}`);
export const createSailor = (data) => api.post('/api/sailors', data);
export const updateSailor = (id, data) => api.put(`/api/sailors/${id}`, data);
export const deleteSailor = (id) => api.delete(`/api/sailors/${id}`);

// Companies
export const getCompanies = (params = {}) => api.get('/api/companies', { params });
export const getCompany = (id) => api.get(`/api/companies/${id}`);
export const createCompany = (data) => api.post('/api/companies', data);
export const updateCompany = (id, data) => api.put(`/api/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/api/companies/${id}`);

// Vacancies
export const getVacancies = (params = {}) => api.get('/api/vacancies', { params });
export const getVacancy = (id) => api.get(`/api/vacancies/${id}`);
export const createVacancy = (data) => api.post('/api/vacancies', data);
export const updateVacancy = (id, data) => api.put(`/api/vacancies/${id}`, data);
export const deleteVacancy = (id) => api.delete(`/api/vacancies/${id}`);
export const findCandidates = (vacancyId) => api.get(`/api/matching/${vacancyId}`);

// Contracts
export const getContracts = (params = {}) => api.get('/api/contracts', { params });
export const getContract = (id) => api.get(`/api/contracts/${id}`);
export const createContract = (data) => api.post('/api/contracts', data);
export const updateContract = (id, data) => api.put(`/api/contracts/${id}`, data);
export const deleteContract = (id) => api.delete(`/api/contracts/${id}`);

// Pipeline
export const getPipeline = (params = {}) => api.get('/api/pipeline', { params });
export const addToPipeline = (data) => api.post('/api/pipeline', data);
export const updatePipeline = (id, data) => api.put(`/api/pipeline/${id}`, data);
export const removeFromPipeline = (id) => api.delete(`/api/pipeline/${id}`);

// Users (Admin)
export const getUsers = () => api.get('/api/users');
export const createUser = (data) => api.post('/api/users', data);
export const deleteUser = (id) => api.delete(`/api/users/${id}`);

// Notifications
export const sendExpiryNotifications = () => api.post('/api/notifications/expiring-documents');

// Seed data
export const seedDemoData = () => api.post('/api/seed');

export default api;

