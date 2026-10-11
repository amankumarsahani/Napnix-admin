import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// preference: 'light' | 'dark' | 'system' (stored); theme: the resolved 'light' | 'dark'.
// index.html applies the same rule before first paint, so keep the two in step.
const readPreference = () => {
    try { return localStorage.getItem('theme') || 'system'; } catch { return 'system'; }
};
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export function ThemeProvider({ children }) {
    const [preference, setPreference] = useState(readPreference);
    const [prefersDark, setPrefersDark] = useState(systemDark);

    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!mq) return undefined;
        const onChange = e => setPrefersDark(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const theme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try { localStorage.setItem('theme', preference); } catch { /* private mode */ }
    }, [theme, preference]);

    const value = {
        theme,
        preference,
        setTheme: setPreference,
        toggleTheme: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
        isDark: theme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
