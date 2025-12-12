import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Use env var in prod
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: (credentials) => api.post('/auth/signin', credentials),
    getProfile: () => api.get('/auth/me'),
};

export const leadsAPI = {
    getAll: () => api.get('/leads'),
    create: (data) => api.post('/leads', data),
    // update: (id, data) => api.put(`/leads/${id}`, data),
    // delete: (id) => api.delete(`/leads/${id}`),
};

// ... other APIs
// Activity API is handled directly in component for now or can be added here
export const activitiesAPI = {
    getByEntity: (type, id) => api.get(`/activities/${type}/${id}`),
    create: (data) => api.post('/activities', data),
};
export const inquiriesAPI = {
    getAll: () => api.get('/inquiries'),
    updateStatus: (id, status) => api.put(`/inquiries/${id}/status`, { status }),
    delete: (id) => api.delete(`/inquiries/${id}`),
};

export const clientsAPI = {
    getAll: () => api.get('/clients'),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
};

export const projectsAPI = {
    getAll: () => api.get('/projects'),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
};

export default api;
