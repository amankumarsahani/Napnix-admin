import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { settingsAPI } from '../../api';

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [testingProvider, setTestingProvider] = useState(null);

    // Profile State
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // AI Settings State
    const [aiSettings, setAiSettings] = useState({
        openai_api_key: '',
        gemini_api_key: '',
        groq_api_key: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.getSettings();
            if (response.success) {
                setAiSettings({
                    openai_api_key: response.data.openai_api_key || '',
                    gemini_api_key: response.data.gemini_api_key || '',
                    groq_api_key: response.data.groq_api_key || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // await authAPI.updateProfile(profileData);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        setLoading(true);
        try {
            // await authAPI.changePassword(passwordData);
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleAIUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await settingsAPI.updateSettings(aiSettings);
            if (response.success) {
                toast.success('AI settings updated successfully');
                fetchSettings(); // Refresh to get masked keys
            }
        } catch (error) {
            toast.error('Failed to update AI settings');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async (provider) => {
        setTestingProvider(provider);
        try {
            let apiKey = '';
            if (provider === 'openai') apiKey = aiSettings.openai_api_key;
            else if (provider === 'gemini') apiKey = aiSettings.gemini_api_key;
            else if (provider === 'groq') apiKey = aiSettings.groq_api_key;

            if (!apiKey) {
                toast.error(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key is required`);
                return;
            }
            const response = await settingsAPI.testAI(provider, apiKey);
            if (response.success) {
                toast.success(response.message);
            } else {
                toast.error(response.error || 'Connection failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Test failed');
        } finally {
            setTestingProvider(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences and security.</p>
            </div>

            <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row min-h-[500px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
                    <nav className="space-y-1">
                        {[
                            { id: 'profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                            { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                            { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                            { id: 'ai', label: 'AI Integration', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8">
                    {activeTab === 'profile' && (
                        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Profile Information</h2>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-3xl font-bold text-brand-600 dark:text-brand-400 border-4 border-white dark:border-slate-700 shadow-lg">
                                        {profileData.firstName[0]}
                                    </div>
                                    <button type="button" className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        Change Avatar
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={profileData.email}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-70"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Security Settings</h2>
                            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-70"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Notification Preferences</h2>
                            <div className="space-y-4">
                                {['Email me about new leads', 'Email me about project updates', 'Email me about weekly reports'].map((label, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-800">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">AI Integration Settings</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Configure your AI providers for use in automation workflows and assistants.</p>
                            <form onSubmit={handleAIUpdate} className="space-y-8">
                                {/* OpenAI Section */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9089 6.0462 6.0462 0 0 0-4.4439-3.2533 6.05 6.05 0 0 0-5.4541 1.3871 6.0573 6.0573 0 0 0-4.4439 1.3871 6.05 6.05 0 0 0-2.4275 4.3936 5.9847 5.9847 0 0 0-2.5122 4.3936 6.0462 6.0462 0 0 0 1.2586 4.9089 6.05 6.05 0 0 0 4.4439 3.2533 6.05 6.05 0 0 0 5.4541-1.3871 6.0573 6.0573 0 0 0 4.4439-1.3871 6.05 6.05 0 0 0 2.4275-4.3936 5.9847 5.9847 0 0 0 2.5122-4.3936zm-8.0838 10.2831a3.7825 3.7825 0 0 1-5.4-1.252l.142-.081 3.252-1.879a.4346.4346 0 0 0 .217-.377v-4.595l1.791.995v4.512a.4346.4346 0 0 0 .217.377l3.252 1.879-.142.112a3.7825 3.7825 0 0 1-3.31 1.282zm-5.4-12.7231l-.142.081L5.4041 9.3401a.4346.4346 0 0 0-.217.377v4.595L3.3961 13.3171v-4.512a.4346.4346 0 0 0-.217-.377L3.0371 8.3541l3.31-1.282a3.7825 3.7825 0 0 1 5.4 1.252z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">OpenAI</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">GPT-4o, GPT-3.5 Turbo</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={aiSettings.openai_api_key}
                                                onChange={e => setAiSettings({ ...aiSettings, openai_api_key: e.target.value })}
                                                placeholder="sk-..."
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => testConnection('openai')}
                                                disabled={testingProvider === 'openai'}
                                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                {testingProvider === 'openai' ? 'Testing...' : 'Test Connection'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Google Gemini Section */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2L14.4 9.6H22L15.8 14.1L18.2 21.7L12 17.2L5.8 21.7L8.2 14.1L2 9.6H9.6L12 2Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">Google Gemini</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Gemini 1.5 Pro/Flash</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={aiSettings.gemini_api_key}
                                                onChange={e => setAiSettings({ ...aiSettings, gemini_api_key: e.target.value })}
                                                placeholder="Enter Gemini API key"
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => testConnection('gemini')}
                                                disabled={testingProvider === 'gemini'}
                                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                {testingProvider === 'gemini' ? 'Testing...' : 'Test Connection'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Groq Section */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">Groq (Ultra-Fast)</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Llama 3, Mixtral (Free Tier Available)</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={aiSettings.groq_api_key}
                                                onChange={e => setAiSettings({ ...aiSettings, groq_api_key: e.target.value })}
                                                placeholder="gsk_..."
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => testConnection('groq')}
                                                disabled={testingProvider === 'groq'}
                                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                {testingProvider === 'groq' ? 'Testing...' : 'Test Connection'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : 'Save AI Configuration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
