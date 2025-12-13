import apiClient from './axios';

export const authAPI = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/signin', { email, password });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },
};

export const clientsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/clients', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/clients', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/clients/stats');
        return response.data;
    },
};

export const projectsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/projects', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/projects/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/projects', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/projects/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/projects/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/projects/stats');
        return response.data;
    },
};

export const leadsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/leads', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/leads/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/leads', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/leads/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/leads/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/leads/stats');
        return response.data;
    },
};

export const inquiriesAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/inquiries', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/inquiries/${id}`);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await apiClient.patch(`/inquiries/${id}/status`, { status });
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/inquiries/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/inquiries/stats');
        return response.data;
    },

    convertToLead: async (id, data = {}) => {
        const response = await apiClient.post(`/inquiries/${id}/convert-to-lead`, data);
        return response.data;
    },
};

export const templatesAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/email-templates', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/email-templates/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/email-templates', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/email-templates/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/email-templates/${id}`);
        return response.data;
    },

    preview: async (id, sampleData = {}) => {
        const response = await apiClient.post(`/email-templates/${id}/preview`, sampleData);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/email-templates/stats');
        return response.data;
    },
};

// Activities API - for tracking notes, calls, status changes etc.
export const activitiesAPI = {
    getByEntity: async (entityType, entityId) => {
        const response = await apiClient.get(`/activities/${entityType}/${entityId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/activities', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/activities/${id}`);
        return response.data;
    },
};
