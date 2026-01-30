import axios from './axios';

const planService = {
    getAllPlans: async () => {
        const response = await axios.get('/api/admin/plans');
        return response.data;
    },

    getPlanById: async (id) => {
        const response = await axios.get(`/api/admin/plans/${id}`);
        return response.data;
    },

    createPlan: async (data) => {
        const response = await axios.post('/api/admin/plans', data);
        return response.data;
    },

    updatePlan: async (id, data) => {
        const response = await axios.put(`/api/admin/plans/${id}`, data);
        return response.data;
    },

    deletePlan: async (id) => {
        const response = await axios.delete(`/api/admin/plans/${id}`);
        return response.data;
    }
};

export default planService;
