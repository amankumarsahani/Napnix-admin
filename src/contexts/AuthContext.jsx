import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/index';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            console.log('[AuthContext] Initializing auth:', { hasToken: !!savedToken, hasUser: !!savedUser });

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                console.log('[AuthContext] Restored auth from localStorage');
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('[AuthContext] Login attempt for:', email);
            const response = await authAPI.login(email, password);
            console.log('[AuthContext] API response:', response);
            const { token: newToken, user: newUser } = response;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            setToken(newToken);
            setUser(newUser);

            console.log('[AuthContext] Login successful, state updated:', { token: newToken, user: newUser });
            return { success: true };
        } catch (error) {
            console.error('[AuthContext] Login error:', error);
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
