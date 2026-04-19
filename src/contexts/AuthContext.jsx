import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/index';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const syncFromStorage = useCallback(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    useEffect(() => {
        window.addEventListener('storage', syncFromStorage);
        return () => window.removeEventListener('storage', syncFromStorage);
    }, [syncFromStorage]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { token: newToken, user: newUser } = response;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            setToken(newToken);
            setUser(newUser);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data?.error || 'Login failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        syncFromStorage,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
