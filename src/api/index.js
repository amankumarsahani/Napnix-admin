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

    bulkCreate: async (leads) => {
        const response = await apiClient.post('/leads/bulk-create', { leads });
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

    assign: async (id, assignedTo) => {
        const response = await apiClient.patch(`/leads/${id}/assign`, { assignedTo });
        return response.data;
    },

    getAssignableUsers: async () => {
        const response = await apiClient.get('/leads/assignable-users');
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

// Dashboard API - for admin dashboard stats
export const dashboardAPI = {
    getStats: async () => {
        const response = await apiClient.get('/dashboard/stats');
        return response.data;
    },

    getRecentActivity: async () => {
        const response = await apiClient.get('/dashboard/recent');
        return response.data;
    }
};

// Document Templates API
export const documentTemplatesAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/document-templates', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/document-templates/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/document-templates', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/document-templates/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/document-templates/${id}`);
        return response.data;
    },

    preview: async (id, variables) => {
        const response = await apiClient.post(`/document-templates/${id}/preview`, { variables });
        return response.data;
    },

    send: async (templateId, to, subject, variables) => {
        const response = await apiClient.post('/document-templates/send', { templateId, to, subject, variables });
        return response.data;
    },
};

// Email Templates API
export const emailTemplatesAPI = {
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

    preview: async (id, data) => {
        const response = await apiClient.post(`/email-templates/${id}/preview`, data);
        return response.data;
    },

    send: async (data) => {
        const response = await apiClient.post('/email-templates/send', data);
        return response.data;
    },
};

// Tenants API (Master Admin)
export const tenantsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/tenants', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/tenants/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/tenants', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.patch(`/tenants/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/tenants/${id}`);
        return response.data;
    },

    provision: async (id) => {
        const response = await apiClient.post(`/tenants/${id}/provision`);
        return response.data;
    },

    start: async (id) => {
        const response = await apiClient.post(`/tenants/${id}/start`);
        return response.data;
    },

    stop: async (id) => {
        const response = await apiClient.post(`/tenants/${id}/stop`);
        return response.data;
    },

    restart: async (id) => {
        const response = await apiClient.post(`/tenants/${id}/restart`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/tenants/stats');
        return response.data;
    },

    getLogs: async (id, lines = 100) => {
        const response = await apiClient.get(`/tenants/${id}/logs`, { params: { lines } });
        return response.data;
    },

    setupCustomDomain: async (id, domains) => {
        // domains = { crm: string, storefront: string, api: string }
        const response = await apiClient.post(`/tenants/${id}/custom-domain`, domains);
        return response.data;
    },

    fullDelete: async (id, options = {}) => {
        const response = await apiClient.delete(`/tenants/${id}/full-delete`, { data: options });
        return response.data;
    },

    endTrial: async (id) => {
        const response = await apiClient.post(`/tenants/${id}/end-trial`);
        return response.data;
    },

    sendPaymentLink: async (id) => {
        const response = await apiClient.post(`/tenants/${id}/send-payment-link`);
        return response.data;
    }
};

// Plans API
export const plansAPI = {
    getAll: async () => {
        const response = await apiClient.get('/plans');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/plans/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/plans', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.patch(`/plans/${id}`, data);
        return response.data;
    },
};

// Campaigns API (Email Marketing)
export const campaignsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/campaigns', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/campaigns/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/campaigns', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/campaigns/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/campaigns/${id}`);
        return response.data;
    },

    start: async (id) => {
        const response = await apiClient.post(`/campaigns/${id}/send`);
        return response.data;
    },

    pause: async (id) => {
        const response = await apiClient.post(`/campaigns/${id}/pause`);
        return response.data;
    },

    resume: async (id) => {
        const response = await apiClient.post(`/campaigns/${id}/resume`);
        return response.data;
    },

    getStats: async (id) => {
        const response = await apiClient.get(`/campaigns/${id}/stats`);
        return response.data;
    },

    getRecipients: async (id, params = {}) => {
        const response = await apiClient.get(`/campaigns/${id}/recipients`, { params });
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await apiClient.get('/campaigns/stats');
        return response.data;
    },

    getTemplates: async () => {
        const response = await apiClient.get('/campaigns/templates');
        return response.data;
    },

    parseEmails: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/campaigns/parse-emails', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};

// SMTP Accounts API (Email Configuration)
export const smtpAccountsAPI = {
    getAll: async () => {
        const response = await apiClient.get('/smtp-accounts');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/smtp-accounts/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/smtp-accounts', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/smtp-accounts/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/smtp-accounts/${id}`);
        return response.data;
    },

    test: async (id) => {
        const response = await apiClient.post(`/smtp-accounts/${id}/test`);
        return response.data;
    },
};

// Workflows API (Automation)
export const workflowsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/workflows', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/workflows/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/workflows', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/workflows/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/workflows/${id}`);
        return response.data;
    },

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
    }
};

export const settingsAPI = {
    getSettings: async () => {
        const response = await apiClient.get('/settings');
        return response.data;
    },
    updateSettings: async (settings) => {
        const response = await apiClient.post('/settings', settings);
        return response.data;
    },
    testAI: async (provider, apiKey) => {
        const response = await apiClient.post('/settings/test-ai', { provider, apiKey });
        return response.data;
    }
};

export const billingAPI = {
    createPaymentLink: async (data) => {
        const response = await apiClient.post('/billing/payment-link', data);
        return response.data;
    },
    getTenantPayments: async (tenantId) => {
        const response = await apiClient.get(`/billing/payments/${tenantId}`);
        return response.data;
    }
};

// Blogs API (Content Management)
export const blogsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/blogs', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/blogs/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/blogs', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/blogs/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/blogs/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/blogs/stats');
        return response.data;
    },
};


