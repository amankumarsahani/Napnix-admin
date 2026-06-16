import apiClient from './axios';

export const whatsappApi = {
    getAccounts: () => apiClient.get('/admin/whatsapp/accounts').then(r => r.data),
    createAccount: (data) => apiClient.post('/admin/whatsapp/accounts', data).then(r => r.data),
    deleteAccount: (id) => apiClient.delete(`/admin/whatsapp/accounts/${id}`).then(r => r.data),
    connectAccount: (id) => apiClient.post(`/admin/whatsapp/accounts/${id}/connect`).then(r => r.data),
    disconnectAccount: (id) => apiClient.post(`/admin/whatsapp/accounts/${id}/disconnect`).then(r => r.data),
    getStatus: (id) => apiClient.get(`/admin/whatsapp/accounts/${id}/status`).then(r => r.data),
    saveMetaCredentials: (id, data) => apiClient.put(`/admin/whatsapp/accounts/${id}/meta-credentials`, data).then(r => r.data),

    getConversations: (accountId) =>
        apiClient.get(`/admin/whatsapp/accounts/${accountId}/conversations`).then(r => r.data),
    getMessages: (conversationId) =>
        apiClient.get(`/admin/whatsapp/conversations/${conversationId}/messages`).then(r => r.data),
    sendMessage: (conversationId, message) =>
        apiClient.post(`/admin/whatsapp/conversations/${conversationId}/messages`, { message }).then(r => r.data),
};
