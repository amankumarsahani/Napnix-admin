import apiClient from './axios';

export const BlogService = {
    // Get all blogs (with optional filters)
    getAll: async (params) => {
        const response = await apiClient.get('/blogs', { params });
        return response.data;
    },

    // Get single blog by ID
    getById: async (id) => {
        const response = await apiClient.get(`/blogs/${id}`);
        return response.data;
    },

    // Create new blog
    create: async (data) => {
        const response = await apiClient.post('/blogs', data);
        return response.data;
    },

    // Update existing blog
    update: async (id, data) => {
        const response = await apiClient.put(`/blogs/${id}`, data);
        return response.data;
    },

    // Delete blog
    delete: async (id) => {
        const response = await apiClient.delete(`/blogs/${id}`);
        return response.data;
    }
};
