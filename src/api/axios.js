import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthEndpoint = originalRequest?.url?.includes('/auth/signin') ||
            originalRequest?.url?.includes('/auth/signup') ||
            originalRequest?.url?.includes('/auth/refresh-token');

        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const currentToken = localStorage.getItem('token');
                if (!currentToken) {
                    throw new Error('No token available');
                }

                const response = await axios.post(
                    `${apiClient.defaults.baseURL}/auth/refresh-token`,
                    {},
                    { headers: { Authorization: `Bearer ${currentToken}` } }
                );

                const { token, user } = response.data;

                localStorage.setItem('token', token);
                if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                }

                originalRequest.headers.Authorization = `Bearer ${token}`;
                processQueue(null, token);

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
