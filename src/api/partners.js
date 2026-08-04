import apiClient from './axios';

/**
 * Whitelabel partner fleet (P1-04).
 *
 * Everything here reads the read-only mirror the master keeps of each partner
 * instance. Nothing writes into a partner database: actions that must take effect
 * on an instance are queued through `queueCommand` and pulled by that instance on
 * its next heartbeat.
 */
const partnersAPI = {
    getAll: async () => {
        const r = await apiClient.get('/partners');
        return r.data;
    },

    getById: async (id) => {
        const r = await apiClient.get(`/partners/${id}`);
        return r.data;
    },

    /** Returns the sync secret exactly once - it cannot be read back afterwards. */
    create: async (data) => {
        const r = await apiClient.post('/partners', data);
        return r.data;
    },

    update: async (id, data) => {
        const r = await apiClient.put(`/partners/${id}`, data);
        return r.data;
    },

    /** Enqueue work for the instance. Applied on its next heartbeat, not now. */
    queueCommand: async (id, command, args = {}) => {
        const r = await apiClient.post(`/partners/${id}/commands`, { command, args });
        return r.data;
    },

    rotateSecret: async (id) => {
        const r = await apiClient.post(`/partners/${id}/rotate-secret`);
        return r.data;
    },
};

export default partnersAPI;
