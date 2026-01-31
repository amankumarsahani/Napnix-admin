import axios from './axios';

const planService = {
    getAllPlans: async () => {
        const response = await axios.get('/plans');
        return response.data;
    },

    getPlanById: async (id) => {
        const response = await axios.get(`/plans/${id}`);
        return response.data;
    },

    createPlan: async (data) => {
        const response = await axios.post('/plans', data);
        return response.data;
    },

    updatePlan: async (id, data) => {
        const response = await axios.put(`/plans/${id}`, data);
        return response.data;
    },

    deletePlan: async (id) => {
        const response = await axios.delete(`/plans/${id}`);
        return response.data;
    }
};

export default planService;