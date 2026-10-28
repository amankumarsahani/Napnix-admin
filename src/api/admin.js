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

export const mobileAppAdminAPI = {
    getCurrentRelease: async () => {
        const response = await axios.get('/admin/mobile-app');
        return response.data;
    },

    uploadRelease: async (formData) => {
        const response = await axios.post('/admin/mobile-app/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const telemetryAdminAPI = {
    getStats: async () => {
        const response = await axios.get('/admin/telemetry/stats');
        return response.data;
    }
};

export const siteAnalyticsAPI = {
    getOverview:       (range) => axios.get('/admin/site-analytics/overview', { params: { range } }).then(r => r.data),
    getTimeSeries:     (range) => axios.get('/admin/site-analytics/time-series', { params: { range } }).then(r => r.data),
    getPages:          (range) => axios.get('/admin/site-analytics/pages', { params: { range } }).then(r => r.data),
    getTrafficSources: (range) => axios.get('/admin/site-analytics/traffic-sources', { params: { range } }).then(r => r.data),
    getDevices:        (range) => axios.get('/admin/site-analytics/devices', { params: { range } }).then(r => r.data),
    getGeography:      (range) => axios.get('/admin/site-analytics/geography', { params: { range } }).then(r => r.data),
    getJourney:        (range) => axios.get('/admin/site-analytics/journey', { params: { range } }).then(r => r.data),
    getEvents:         (range) => axios.get('/admin/site-analytics/events', { params: { range } }).then(r => r.data),
    getAIInsights:     (analytics) => axios.post('/admin/site-analytics/ai-insights', { analytics }).then(r => r.data),
    getHeatmap:        (page, range) => axios.get('/admin/site-analytics/heatmap', { params: { page, range } }).then(r => r.data),
};

// Tenant health + security monitoring (nexs-backend workers/tenantMonitorWorker.js)
export const tenantMonitorAPI = {
    getOverview: ()                 => axios.get('/admin/tenant-monitor/overview').then(r => r.data),
    getChecks:   (tenantId, hours)  => axios.get(`/admin/tenant-monitor/tenants/${tenantId}/checks`, { params: { hours } }).then(r => r.data),
    getEvents:   (params)           => axios.get('/admin/tenant-monitor/events', { params }).then(r => r.data),
    acknowledge: (ids)              => axios.post('/admin/tenant-monitor/events/ack', { ids }).then(r => r.data),
};

export default serverService;
