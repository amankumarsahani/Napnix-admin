import axios from 'axios';

const nexmailClient = axios.create({
    baseURL: import.meta.env.VITE_NEXMAIL_API_URL || 'http://localhost:5050/api',
    timeout: 30000,
});

nexmailClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const tenantId = localStorage.getItem('nexmail_tenant_id') || '1';
    config.headers['X-Tenant-Id'] = tenantId;
    return config;
});

nexmailClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const nmContactsAPI = {
    getAll: async (params = {}) => { const r = await nexmailClient.get('/contacts', { params }); return r.data; },
    getById: async (id) => { const r = await nexmailClient.get(`/contacts/${id}`); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/contacts', data); return r.data; },
    update: async (id, data) => { const r = await nexmailClient.put(`/contacts/${id}`, data); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/contacts/${id}`); return r.data; },
    getStats: async () => { const r = await nexmailClient.get('/contacts/stats'); return r.data; },
    addTags: async (id, tags) => { const r = await nexmailClient.post(`/contacts/${id}/tags`, { tags }); return r.data; },
    import: async (data) => { const r = await nexmailClient.post('/contacts/import', data); return r.data; },
};

export const nmListsAPI = {
    getAll: async () => { const r = await nexmailClient.get('/lists'); return r.data; },
    getById: async (id, params = {}) => { const r = await nexmailClient.get(`/lists/${id}`, { params }); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/lists', data); return r.data; },
    update: async (id, data) => { const r = await nexmailClient.put(`/lists/${id}`, data); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/lists/${id}`); return r.data; },
    addMembers: async (id, contact_ids) => { const r = await nexmailClient.post(`/lists/${id}/members`, { contact_ids }); return r.data; },
    removeMembers: async (id, contact_ids) => { const r = await nexmailClient.delete(`/lists/${id}/members`, { data: { contact_ids } }); return r.data; },
    getCount: async (id) => { const r = await nexmailClient.get(`/lists/${id}/count`); return r.data; },
};

export const nmTemplatesAPI = {
    getAll: async (params = {}) => { const r = await nexmailClient.get('/templates', { params }); return r.data; },
    getById: async (id) => { const r = await nexmailClient.get(`/templates/${id}`); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/templates', data); return r.data; },
    update: async (id, data) => { const r = await nexmailClient.put(`/templates/${id}`, data); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/templates/${id}`); return r.data; },
    clone: async (id) => { const r = await nexmailClient.post(`/templates/${id}/clone`); return r.data; },
    getVersions: async (id) => { const r = await nexmailClient.get(`/templates/${id}/versions`); return r.data; },
    preview: async (data) => { const r = await nexmailClient.post('/templates/preview', data); return r.data; },
    compile: async (blocks_json) => { const r = await nexmailClient.post('/templates/compile', { blocks_json }); return r.data; },
    getBlockTypes: async () => { const r = await nexmailClient.get('/templates/block-types'); return r.data; },
    checkSpam: async (data) => { const r = await nexmailClient.post('/templates/spam-check', data); return r.data; },
};

export const nmCampaignsAPI = {
    getAll: async (params = {}) => { const r = await nexmailClient.get('/campaigns', { params }); return r.data; },
    getById: async (id) => { const r = await nexmailClient.get(`/campaigns/${id}`); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/campaigns', data); return r.data; },
    update: async (id, data) => { const r = await nexmailClient.put(`/campaigns/${id}`, data); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/campaigns/${id}`); return r.data; },
    send: async (id) => { const r = await nexmailClient.post(`/campaigns/${id}/send`); return r.data; },
    pause: async (id) => { const r = await nexmailClient.post(`/campaigns/${id}/pause`); return r.data; },
    resume: async (id) => { const r = await nexmailClient.post(`/campaigns/${id}/resume`); return r.data; },
    clone: async (id) => { const r = await nexmailClient.post(`/campaigns/${id}/clone`); return r.data; },
    getAnalytics: async (id) => { const r = await nexmailClient.get(`/campaigns/${id}/analytics`); return r.data; },
    getRecipients: async (id, params = {}) => { const r = await nexmailClient.get(`/campaigns/${id}/recipients`, { params }); return r.data; },
    sendTest: async (id, test_email) => { const r = await nexmailClient.post(`/campaigns/${id}/test`, { test_email }); return r.data; },
    estimateAudience: async (data) => { const r = await nexmailClient.post('/campaigns/estimate-audience', data); return r.data; },
};

export const nmAutomationsAPI = {
    getAll: async () => { const r = await nexmailClient.get('/automations'); return r.data; },
    getById: async (id) => { const r = await nexmailClient.get(`/automations/${id}`); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/automations', data); return r.data; },
    update: async (id, data) => { const r = await nexmailClient.put(`/automations/${id}`, data); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/automations/${id}`); return r.data; },
    activate: async (id) => { const r = await nexmailClient.post(`/automations/${id}/activate`); return r.data; },
    pause: async (id) => { const r = await nexmailClient.post(`/automations/${id}/pause`); return r.data; },
    getEnrollments: async (id, params = {}) => { const r = await nexmailClient.get(`/automations/${id}/enrollments`, { params }); return r.data; },
    enroll: async (id, contact_ids) => { const r = await nexmailClient.post(`/automations/${id}/enroll`, { contact_ids }); return r.data; },
    getAnalytics: async (id) => { const r = await nexmailClient.get(`/automations/${id}/analytics`); return r.data; },
};

export const nmSmtpAPI = {
    getAll: async () => { const r = await nexmailClient.get('/smtp'); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/smtp', data); return r.data; },
    update: async (id, data) => { const r = await nexmailClient.put(`/smtp/${id}`, data); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/smtp/${id}`); return r.data; },
    test: async (data) => { const r = await nexmailClient.post('/smtp/test', data); return r.data; },
    getHealth: async () => { const r = await nexmailClient.get('/smtp/health'); return r.data; },
};

export const nmAnalyticsAPI = {
    getDashboard: async () => { const r = await nexmailClient.get('/analytics/dashboard'); return r.data; },
    getSendVolume: async (days = 30) => { const r = await nexmailClient.get('/analytics/send-volume', { params: { days } }); return r.data; },
    getGrowth: async (days = 90) => { const r = await nexmailClient.get('/analytics/growth', { params: { days } }); return r.data; },
    getHeatmap: async () => { const r = await nexmailClient.get('/analytics/engagement-heatmap'); return r.data; },
    getLeaderboard: async () => { const r = await nexmailClient.get('/analytics/campaign-leaderboard'); return r.data; },
    recalculateScores: async () => { const r = await nexmailClient.post('/analytics/recalculate-scores'); return r.data; },
};

export const nmDomainsAPI = {
    getAll: async () => { const r = await nexmailClient.get('/domains'); return r.data; },
    create: async (data) => { const r = await nexmailClient.post('/domains', data); return r.data; },
    verify: async (id) => { const r = await nexmailClient.post(`/domains/${id}/verify`); return r.data; },
    delete: async (id) => { const r = await nexmailClient.delete(`/domains/${id}`); return r.data; },
};

export default nexmailClient;
