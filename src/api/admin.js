import axios from './axios';

const serverService = {
    getAllServers: async (params = {}) => {
        const response = await axios.get('/admin/servers', { params });
        return response.data;
    },

    getServerById: async (id) => {
        const response = await axios.get(`/admin/servers/${id}`);
        return response.data;
    },

    createServer: async (data) => {
        const response = await axios.post('/admin/servers', data);
        return response.data;
    },

    updateServer: async (id, data) => {
        const response = await axios.put(`/admin/servers/${id}`, data);
        return response.data;
    },

    testConnection: async (id) => {
        const response = await axios.post(`/admin/servers/${id}/test`);
        return response.data;
    },

    // Backup Accounts
    getAllBackupAccounts: async () => {
        const response = await axios.get('/admin/backup-accounts');
        return response.data;
    },

    createBackupAccount: async (data) => {
        const response = await axios.post('/admin/backup-accounts', data);
        return response.data;
    },

    updateBackupAccount: async (id, data) => {
        const response = await axios.put(`/admin/backup-accounts/${id}`, data);
        return response.data;
    },

    deleteBackupAccount: async (id) => {
        const response = await axios.delete(`/admin/backup-accounts/${id}`);
        return response.data;
    },

    triggerManualBackup: async () => {
        const response = await axios.post('/admin/backup-accounts/run-now');
        return response.data;
    },

    exchangeGoogleOauthCode: async (data) => {
        const response = await axios.post('/admin/backup-accounts/google-oauth/exchange', data);
        return response.data;
    }
};

export default serverService;
