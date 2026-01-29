import axios from './axios';

const serverService = {
    getAllServers: async () => {
        const response = await axios.get('/api/admin/servers');
        return response.data;
    },

    getServerById: async (id) => {
        const response = await axios.get(`/api/admin/servers/${id}`);
        return response.data;
    },

    createServer: async (data) => {
        const response = await axios.post('/api/admin/servers', data);
        return response.data;
    },

    updateServer: async (id, data) => {
        const response = await axios.put(`/api/admin/servers/${id}`, data);
        return response.data;
    },

    testConnection: async (id) => {
        const response = await axios.post(`/api/admin/servers/${id}/test`);
        return response.data;
    },

    // Backup Accounts
    getAllBackupAccounts: async () => {
        const response = await axios.get('/api/admin/backup-accounts');
        return response.data;
    },

    createBackupAccount: async (data) => {
        const response = await axios.post('/api/admin/backup-accounts', data);
        return response.data;
    }
};

export default serverService;
