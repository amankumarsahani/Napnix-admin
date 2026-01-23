import api from './api';

const API_BASE = '/blogs';

export const blogsAPI = {
    // Public endpoints
    getPublished: (category) => api.get(API_BASE, { params: { category } }),
    getBySlug: (slug) => api.get(`${API_BASE}/slug/${slug}`),
    getCategories: () => api.get(`${API_BASE}/categories`),

    // Admin endpoints
    getAll: () => api.get(`${API_BASE}/admin/all`),
    getById: (id) => api.get(`${API_BASE}/admin/${id}`),
    create: (data) => api.post(API_BASE, data),
    update: (id, data) => api.put(`${API_BASE}/${id}`, data),
    delete: (id) => api.delete(`${API_BASE}/${id}`)
};

export default blogsAPI;
