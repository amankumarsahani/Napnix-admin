import apiClient from './axios';

// ─── CRUD Factory ────────────────────────────────────────────────────────────
// Generates standard CRUD operations for a given base path.
// `updateMethod` defaults to 'put' but can be 'patch' for specific entities.

function createCrudAPI(basePath, { updateMethod = 'put', hasParams = true } = {}) {
    return {
        getAll: hasParams
            ? async (params = {}) => { const r = await apiClient.get(basePath, { params }); return r.data; }
            : async () => { const r = await apiClient.get(basePath); return r.data; },
        getById: async (id) => { const r = await apiClient.get(`${basePath}/${id}`); return r.data; },
        create: async (data) => { const r = await apiClient.post(basePath, data); return r.data; },
        update: async (id, data) => { const r = await apiClient[updateMethod](`${basePath}/${id}`, data); return r.data; },
        delete: async (id) => { const r = await apiClient.delete(`${basePath}/${id}`); return r.data; },
    };
}

const statsEndpoint = (basePath) => async () => { const r = await apiClient.get(`${basePath}/stats`); return r.data; };

// ─── Auth API ────────────────────────────────────────────────────────────────

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
    refreshToken: async () => {
        const response = await apiClient.post('/auth/refresh-token');
        return response.data;
    },
};

// ─── Clients API ─────────────────────────────────────────────────────────────

export const clientsAPI = {
    ...createCrudAPI('/clients'),
    getStats: statsEndpoint('/clients'),
};

// ─── Projects API ────────────────────────────────────────────────────────────

export const projectsAPI = {
    ...createCrudAPI('/projects'),
    getStats: statsEndpoint('/projects'),
};

// ─── Leads API ───────────────────────────────────────────────────────────────

export const leadsAPI = {
    ...createCrudAPI('/leads'),
    bulkCreate: async (leads) => {
        const response = await apiClient.post('/leads/bulk-create', { leads });
        return response.data;
    },
    getStats: statsEndpoint('/leads'),
    assign: async (id, assignedTo) => {
        const response = await apiClient.patch(`/leads/${id}/assign`, { assignedTo });
        return response.data;
    },
    getAssignableUsers: async () => {
        const response = await apiClient.get('/leads/assignable-users');
        return response.data;
    },
};

// ─── Inquiries API ───────────────────────────────────────────────────────────

export const inquiriesAPI = {
    getAll: async (params = {}) => { const r = await apiClient.get('/inquiries', { params }); return r.data; },
    getById: async (id) => { const r = await apiClient.get(`/inquiries/${id}`); return r.data; },
    updateStatus: async (id, status) => {
        const response = await apiClient.patch(`/inquiries/${id}/status`, { status });
        return response.data;
    },
    delete: async (id) => { const r = await apiClient.delete(`/inquiries/${id}`); return r.data; },
    getStats: statsEndpoint('/inquiries'),
    convertToLead: async (id, data = {}) => {
        const response = await apiClient.post(`/inquiries/${id}/convert-to-lead`, data);
        return response.data;
    },
};

// ─── Email Templates API ─────────────────────────────────────────────────────

export const templatesAPI = {
    ...createCrudAPI('/email-templates'),
    preview: async (id, sampleData = {}) => {
        const response = await apiClient.post(`/email-templates/${id}/preview`, sampleData);
        return response.data;
    },
    getStats: statsEndpoint('/email-templates'),
    send: async (data) => {
        const response = await apiClient.post('/email-templates/send', data);
        return response.data;
    },
};

// ─── Activities API ──────────────────────────────────────────────────────────

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

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardAPI = {
    getStats: statsEndpoint('/dashboard'),
    getRecentActivity: async () => {
        const response = await apiClient.get('/dashboard/recent');
        return response.data;
    },
};

// ─── Document Templates API ──────────────────────────────────────────────────

export const documentTemplatesAPI = {
    ...createCrudAPI('/document-templates'),
    preview: async (id, variables) => {
        const response = await apiClient.post(`/document-templates/${id}/preview`, { variables });
        return response.data;
    },
    send: async (templateId, to, subject, variables) => {
        const response = await apiClient.post('/document-templates/send', { templateId, to, subject, variables });
        return response.data;
    },
};

// ─── Tenants API (Master Admin) ─────────────────────────────────────────────

export const tenantsAPI = {
    ...createCrudAPI('/tenants', { updateMethod: 'patch' }),
    provision: async (id) => { const r = await apiClient.post(`/tenants/${id}/provision`); return r.data; },
    start: async (id) => { const r = await apiClient.post(`/tenants/${id}/start`); return r.data; },
    stop: async (id) => { const r = await apiClient.post(`/tenants/${id}/stop`); return r.data; },
    restart: async (id) => { const r = await apiClient.post(`/tenants/${id}/restart`); return r.data; },
    getStats: statsEndpoint('/tenants'),
    getLogs: async (id, lines = 100) => {
        const response = await apiClient.get(`/tenants/${id}/logs`, { params: { lines } });
        return response.data;
    },
    setupCustomDomain: async (id, domains) => {
        const response = await apiClient.post(`/tenants/${id}/custom-domain`, domains);
        return response.data;
    },
    fullDelete: async (id, options = {}) => {
        const response = await apiClient.delete(`/tenants/${id}/full-delete`, { data: options });
        return response.data;
    },
    endTrial: async (id) => { const r = await apiClient.post(`/tenants/${id}/end-trial`); return r.data; },
    sendPaymentLink: async (id, data = {}) => { const r = await apiClient.post(`/tenants/${id}/send-payment-link`, data); return r.data; },
    sendBillingInvoice: async (id, data = {}) => { const r = await apiClient.post(`/tenants/${id}/send-billing-invoice`, data); return r.data; },
    markPaid: async (id, data = {}) => { const r = await apiClient.post(`/tenants/${id}/mark-paid`, data); return r.data; },
    sendAgreement: async (id) => { const r = await apiClient.post(`/tenants/${id}/send-agreement`); return r.data; },
    repairDns: async (id) => { const r = await apiClient.post(`/tenants/${id}/repair-dns`); return r.data; },
};

// ─── Plans API ───────────────────────────────────────────────────────────────

export const plansAPI = {
    getAll: async () => { const r = await apiClient.get('/plans'); return r.data; },
    getById: async (id) => { const r = await apiClient.get(`/plans/${id}`); return r.data; },
    create: async (data) => { const r = await apiClient.post('/plans', data); return r.data; },
    update: async (id, data) => { const r = await apiClient.patch(`/plans/${id}`, data); return r.data; },
};

// ─── Campaigns API (Email Marketing) ────────────────────────────────────────

export const campaignsAPI = {
    ...createCrudAPI('/campaigns'),
    start: async (id) => { const r = await apiClient.post(`/campaigns/${id}/send`); return r.data; },
    pause: async (id) => { const r = await apiClient.post(`/campaigns/${id}/pause`); return r.data; },
    resume: async (id) => { const r = await apiClient.post(`/campaigns/${id}/resume`); return r.data; },
    getStats: async (id) => { const r = await apiClient.get(`/campaigns/${id}/stats`); return r.data; },
    getRecipients: async (id, params = {}) => {
        const response = await apiClient.get(`/campaigns/${id}/recipients`, { params });
        return response.data;
    },
    getDashboardStats: async () => { const r = await apiClient.get('/campaigns/stats'); return r.data; },
    getTemplates: async () => { const r = await apiClient.get('/campaigns/templates'); return r.data; },
    parseEmails: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/campaigns/parse-emails', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};

// ─── SMTP Accounts API ──────────────────────────────────────────────────────

export const smtpAccountsAPI = {
    ...createCrudAPI('/smtp-accounts'),
    test: async (id) => {
        const response = await apiClient.post(`/smtp-accounts/${id}/test`);
        return response.data;
    },
};

// ─── Workflows API (Automation) ─────────────────────────────────────────────

export const workflowsAPI = {
    ...createCrudAPI('/workflows'),
    toggle: async (id) => {
        const response = await apiClient.patch(`/workflows/${id}/toggle`);
        return response.data;
    },
    test: async (id, testData) => {
        const response = await apiClient.post(`/workflows/${id}/test`, { testData });
        return response.data;
    },
    getExecutions: async (id, params = {}) => {
        const response = await apiClient.get(`/workflows/${id}/executions`, { params });
        return response.data;
    },
    getExecutionLogs: async (executionId) => {
        const response = await apiClient.get(`/workflows/executions/${executionId}/logs`);
        return response.data;
    },
    getNodeTypes: async () => {
        const response = await apiClient.get('/workflows/meta/node-types');
        return response.data;
    },
};

// ─── Settings API ───────────────────────────────────────────────────────────

export const settingsAPI = {
    getSettings: async () => { const r = await apiClient.get('/settings'); return r.data; },
    updateSettings: async (settings) => { const r = await apiClient.post('/settings', settings); return r.data; },
    testAI: async (provider, apiKey) => {
        const response = await apiClient.post('/settings/test-ai', { provider, apiKey });
        return response.data;
    },
    testSmtp: async (data) => {
        const response = await apiClient.post('/settings/test-smtp', data);
        return response.data;
    }
};

// ─── Billing API ────────────────────────────────────────────────────────────

export const billingAPI = {
    createPaymentLink: async (data) => {
        const response = await apiClient.post('/billing/payment-link', data);
        return response.data;
    },
    getSubscription: async (tenantId) => {
        const response = await apiClient.get(`/billing/subscriptions/${tenantId}`);
        return response.data;
    },
    pauseSubscription: async (tenantId) => {
        const response = await apiClient.post(`/billing/subscriptions/${tenantId}/pause`);
        return response.data;
    },
    resumeSubscription: async (tenantId) => {
        const response = await apiClient.post(`/billing/subscriptions/${tenantId}/resume`);
        return response.data;
    },
    cancelSubscription: async (tenantId, data = {}) => {
        const response = await apiClient.post(`/billing/subscriptions/${tenantId}/cancel`, data);
        return response.data;
    },
    getTenantPayments: async (tenantId) => {
        const response = await apiClient.get(`/billing/payments/${tenantId}`);
        return response.data;
    },
};

// ─── Blogs API (Content Management) ─────────────────────────────────────────

export const blogsAPI = {
    ...createCrudAPI('/blogs'),
    getStats: statsEndpoint('/blogs'),
};

// ─── Tool Registry API ──────────────────────────────────────────────────────

export const toolsAPI = {
    getAll: async () => { const r = await apiClient.get('/tools'); return r.data; },
    getPlans: async (toolId) => { const r = await apiClient.get(`/tools/${toolId}/plans`); return r.data; },
    getTenantTools: async (tenantId) => { const r = await apiClient.get(`/tools/tenant/${tenantId}`); return r.data; },
    enableCRM: async (tenantId, data) => {
        const response = await apiClient.post(`/tools/tenant/${tenantId}/enable-crm`, data);
        return response.data;
    },
    enableTool: async (tenantId, data) => {
        const response = await apiClient.post(`/tools/tenant/${tenantId}/enable`, data);
        return response.data;
    },
    disableTool: async (tenantId, data) => {
        const response = await apiClient.post(`/tools/tenant/${tenantId}/disable`, data);
        return response.data;
    },
    getToolStats: async (tenantId, toolSlug) => {
        const response = await apiClient.get(`/tools/tenant/${tenantId}/${toolSlug}/stats`);
        return response.data;
    },
};

// ─── Expenses API ───────────────────────────────────────────────────────────

export const expensesAPI = {
    getAll: async (params = {}) => { const r = await apiClient.get('/expenses', { params }); return r.data; },
    getStats: async () => { const r = await apiClient.get('/expenses/stats'); return r.data; },
    getById: async (id) => { const r = await apiClient.get(`/expenses/${id}`); return r.data; },
    create: async (data) => { const r = await apiClient.post('/expenses', data); return r.data; },
    update: async (id, data) => { const r = await apiClient.patch(`/expenses/${id}`, data); return r.data; },
    delete: async (id) => { const r = await apiClient.delete(`/expenses/${id}`); return r.data; },
    bulkDelete: async (ids) => { const r = await apiClient.post('/expenses/bulk-delete', { ids }); return r.data; },
};

// ─── NapMail API ────────────────────────────────────────────────────────────

export const nexmailAPI = {
    baseUrl: import.meta.env.VITE_NEXMAIL_API_URL || '',
    getDashboard: async (tenantId) => {
        const response = await apiClient.get(`/tools/tenant/${tenantId}/nexmail/stats`);
        return response.data;
    },
};
