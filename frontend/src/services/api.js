import axios from 'axios';

const API_BASE_URL = '/api';

// Client API calls
export const clientAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/clients`),
  getById: (id) => axios.get(`${API_BASE_URL}/clients/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/clients`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/clients/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/clients/${id}`),
  bulkImport: (clients) => axios.post(`${API_BASE_URL}/clients/bulk`, { clients }),
};

// Inventory API calls
export const inventoryAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/inventory`),
  getById: (id) => axios.get(`${API_BASE_URL}/inventory/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/inventory`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/inventory/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/inventory/${id}`),
  bulkImport: (inventory) => axios.post(`${API_BASE_URL}/inventory/bulk`, { inventory }),
};

// Meeting API calls
export const meetingAPI = {
  getAll: (params = {}) => axios.get(`${API_BASE_URL}/meetings`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/meetings/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/meetings`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/meetings/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/meetings/${id}`),
  getUpcoming: () => axios.get(`${API_BASE_URL}/meetings/filter/upcoming`),
  updateStatus: (id, status) => axios.patch(`${API_BASE_URL}/meetings/${id}/status`, { status }),
};

// Notes API calls
export const noteAPI = {
  getAll: (params = {}) => axios.get(`${API_BASE_URL}/notes`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/notes/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/notes`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/notes/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/notes/${id}`),
  getDueReminders: () => axios.get(`${API_BASE_URL}/notes/filter/reminders`),
  toggleStar: (id) => axios.patch(`${API_BASE_URL}/notes/${id}/star`),
  toggleArchive: (id) => axios.patch(`${API_BASE_URL}/notes/${id}/archive`),
  getStats: () => axios.get(`${API_BASE_URL}/notes/filter/stats`),
};

// Generic error handler
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'Server error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Unable to connect to server. Please check your connection.';
  } else {
    // Something else happened
    return 'An unexpected error occurred';
  }
};