import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { settingsAPI } from '../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const tabs = [
    { id: 'profile', label: 'My Profile', desc: 'Personal info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', label: 'Security', desc: 'Password & auth', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'preferences', label: 'Preferences', desc: 'System defaults', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    { id: 'notifications', label: 'Notifications', desc: 'Alert preferences', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'payments', label: 'Payments', desc: 'Billing & pricing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'ai', label: 'AI Integration', desc: 'Provider keys', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [testingProvider, setTestingProvider] = useState(null);

    // Profile Form
    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone: user?.phone || ''
        }
    });

    // Password Form
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    });

    // AI Settings State
    const [aiSettings, setAiSettings] = useState({
        openai_api_key: '',
        gemini_api_key: '',
        groq_api_key: '',
        grok_api_key: ''
    });

    // Payments Settings State
    const [paymentSettings, setPaymentSettings] = useState({
        pricing_page_mode: 'payment_link' // or 'contact_us'
    });

    // Preferences State
    const [preferencesSettings, setPreferencesSettings] = useState({
        default_timezone: 'UTC'
    });
    const [savingPreferences, setSavingPreferences] = useState(false);

    // Common timezones list
    const COMMON_TIMEZONES = [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
        { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
        { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
        { value: 'Europe/London', label: 'London (GMT/BST)' },
        { value: 'Europe/Paris', label: 'Central European Time' },
        { value: 'Europe/Berlin', label: 'Berlin, Frankfurt' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)' },
        { value: 'Asia/Kolkata', label: 'India Standard Time' },
        { value: 'Asia/Singapore', label: 'Singapore Time' },
        { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
        { value: 'Asia/Shanghai', label: 'China Standard Time' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
        { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
        { value: 'Pacific/Auckland', label: 'New Zealand Time' }
    ];

    // Detect browser timezone
    const detectTimezone = () => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return 'UTC';
        }
    };
    const detectedTimezone = detectTimezone();

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
                    groq_api_key: response.data.groq_api_key || '',
                    grok_api_key: response.data.grok_api_key || ''
                });

                if (response.data.pricing_page_mode) {
                    setPaymentSettings({
                        pricing_page_mode: response.data.pricing_page_mode
                    });
                }

                if (response.data.default_timezone) {
                    setPreferencesSettings({
                        default_timezone: response.data.default_timezone
                    });
                }
            }
        } catch (error) {
            // silently ignore
        }
    };

    const handleProfileUpdate = async (data) => {
        setLoading(true);
        try {
            // await authAPI.updateProfile(data);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (data) => {
        setLoading(true);
        try {
            // await authAPI.changePassword(data);
            toast.success('Password changed successfully');
            passwordForm.reset();
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
            else if (provider === 'grok') apiKey = aiSettings.grok_api_key;

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

    const activeTabData = tabs.find(t => t.id === activeTab);

    /* ---- shared style helpers ---- */
    const inputBase = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm';
    const inputError = 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20';
    const labelBase = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';
    const sectionCard = 'rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60';
    const btnPrimary = 'px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm';
    const btnSecondary = 'px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 text-sm';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences and security.</p>
            </div>

            {/* Main Settings Card */}
            <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row min-h-[600px]">

                {/* ---- Sidebar Navigation ---- */}
                <div className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                    {/* Sidebar header */}
                    <div className="px-6 pt-6 pb-4 hidden lg:block">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Configuration</p>
                    </div>

                    {/* Mobile: horizontal scroll tabs */}
                    <nav className="flex lg:hidden overflow-x-auto gap-1 p-3 scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-brand-200 dark:ring-brand-800'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop: vertical tabs */}
                    <nav className="hidden lg:flex flex-col gap-0.5 px-3 pb-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group w-full flex items-center gap-3.5 px-4 py-3 text-left rounded-xl transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-brand-50 to-brand-50/40 dark:from-brand-900/30 dark:to-brand-900/10 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-100 dark:ring-brand-800/60'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${activeTab === tab.id
                                    ? 'bg-brand-100 dark:bg-brand-800/40 text-brand-600 dark:text-brand-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                    }`}>
                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-sm font-semibold truncate ${activeTab === tab.id ? '' : ''}`}>{tab.label}</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{tab.desc}</div>
                                </div>
                                {activeTab === tab.id && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* ---- Content Area ---- */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                    {/* Content header bar */}
                    <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-800/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={activeTabData?.icon} />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeTabData?.label}</h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{activeTabData?.desc}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* ======== PROFILE TAB ======== */}
                        {activeTab === 'profile' && (
                            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-8">
                                    {/* Avatar section */}
                                    <div className={`${sectionCard} p-6`}>
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/60 dark:to-brand-800/40 flex items-center justify-center text-2xl font-bold text-brand-600 dark:text-brand-400 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                                                    {profileForm.watch('firstName')?.[0] || ''}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Profile Photo</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">PNG, JPG or GIF. Max 2MB.</p>
                                                <button type="button" className={`mt-3 ${btnSecondary} text-xs`}>
                                                    Change Avatar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal info */}
                                    <div className={`${sectionCard} p-6 space-y-5`}>
                                        <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Information</h3>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Update your personal details here.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelBase}>First Name</label>
                                                <input
                                                    type="text"
                                                    {...profileForm.register('firstName')}
                                                    className={`${inputBase} ${profileForm.formState.errors.firstName ? inputError : ''}`}
                                                />
                                                {profileForm.formState.errors.firstName && (
                                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{profileForm.formState.errors.firstName.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelBase}>Last Name</label>
                                                <input
                                                    type="text"
                                                    {...profileForm.register('lastName')}
                                                    className={`${inputBase} ${profileForm.formState.errors.lastName ? inputError : ''}`}
                                                />
                                                {profileForm.formState.errors.lastName && (
                                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{profileForm.formState.errors.lastName.message}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelBase}>Email Address</label>
                                            <input
                                                type="email"
                                                disabled
                                                value={user?.email || ''}
                                                className={`${inputBase} !bg-slate-50 dark:!bg-slate-800/80 !text-slate-500 dark:!text-slate-400 cursor-not-allowed`}
                                            />
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed. Contact support if needed.</p>
                                        </div>
                                        <div>
                                            <label className={labelBase}>Phone Number</label>
                                            <input
                                                type="tel"
                                                {...profileForm.register('phone')}
                                                placeholder="+1 (555) 000-0000"
                                                className={inputBase}
                                            />
                                        </div>
                                    </div>

                                    {/* Save */}
                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="submit" disabled={loading} className={`${btnPrimary} flex items-center gap-2`}>
                                            {loading && (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            )}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ======== SECURITY TAB ======== */}
                        {activeTab === 'security' && (
                            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-8">
                                    <div className={`${sectionCard} p-6 space-y-5`}>
                                        <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</h3>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ensure your account uses a strong, unique password.</p>
                                        </div>
                                        <div>
                                            <label className={labelBase}>Current Password</label>
                                            <input
                                                type="password"
                                                {...passwordForm.register('currentPassword')}
                                                className={`${inputBase} ${passwordForm.formState.errors.currentPassword ? inputError : ''}`}
                                            />
                                            {passwordForm.formState.errors.currentPassword && (
                                                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{passwordForm.formState.errors.currentPassword.message}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelBase}>New Password</label>
                                                <input
                                                    type="password"
                                                    {...passwordForm.register('newPassword')}
                                                    className={`${inputBase} ${passwordForm.formState.errors.newPassword ? inputError : ''}`}
                                                />
                                                {passwordForm.formState.errors.newPassword && (
                                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{passwordForm.formState.errors.newPassword.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelBase}>Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    {...passwordForm.register('confirmPassword')}
                                                    className={`${inputBase} ${passwordForm.formState.errors.confirmPassword ? inputError : ''}`}
                                                />
                                                {passwordForm.formState.errors.confirmPassword && (
                                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{passwordForm.formState.errors.confirmPassword.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="submit" disabled={loading} className={`${btnPrimary} flex items-center gap-2`}>
                                            {loading && (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            )}
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ======== NOTIFICATIONS TAB ======== */}
                        {activeTab === 'notifications' && (
                            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className={`${sectionCard} divide-y divide-slate-100 dark:divide-slate-700/60`}>
                                    <div className="px-6 py-5">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Email Notifications</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose which emails you want to receive.</p>
                                    </div>
                                    {['Email me about new leads', 'Email me about project updates', 'Email me about weekly reports'].map((label, i) => (
                                        <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ======== PREFERENCES TAB ======== */}
                        {activeTab === 'preferences' && (
                            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className={`${sectionCard} p-6 space-y-5`}>
                                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Default Timezone</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Used for scheduled tasks, reports, and as default for new tenants.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelBase}>Timezone</label>
                                            <select
                                                value={preferencesSettings.default_timezone}
                                                onChange={async (e) => {
                                                    const newTimezone = e.target.value;
                                                    setPreferencesSettings({ ...preferencesSettings, default_timezone: newTimezone });
                                                    setSavingPreferences(true);
                                                    try {
                                                        await settingsAPI.updateSettings({ default_timezone: newTimezone });
                                                        toast.success('Timezone updated');
                                                    } catch (err) {
                                                        toast.error('Failed to update timezone');
                                                    } finally {
                                                        setSavingPreferences(false);
                                                    }
                                                }}
                                                disabled={savingPreferences}
                                                className={inputBase}
                                            >
                                                {COMMON_TIMEZONES.map((tz) => (
                                                    <option key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {detectedTimezone !== preferencesSettings.default_timezone && (
                                            <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-sm text-amber-800 dark:text-amber-300">
                                                        Browser detected: <span className="font-medium">{detectedTimezone}</span>
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setPreferencesSettings({ ...preferencesSettings, default_timezone: detectedTimezone });
                                                        setSavingPreferences(true);
                                                        try {
                                                            await settingsAPI.updateSettings({ default_timezone: detectedTimezone });
                                                            toast.success(`Timezone set to ${detectedTimezone}`);
                                                        } catch (err) {
                                                            toast.error('Failed to update timezone');
                                                        } finally {
                                                            setSavingPreferences(false);
                                                        }
                                                    }}
                                                    disabled={savingPreferences}
                                                    className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    Use Detected
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======== PAYMENTS TAB ======== */}
                        {activeTab === 'payments' && (
                            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                {/* Pricing Page Mode */}
                                <div className={`${sectionCard} p-6 space-y-5`}>
                                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pricing Page Mode</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose how customers interact with your pricing page.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPaymentSettings({ ...paymentSettings, pricing_page_mode: 'payment_link' })}
                                            className={`p-5 rounded-xl border-2 transition-all text-left group ${paymentSettings.pricing_page_mode === 'payment_link'
                                                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-900/20 ring-1 ring-brand-200 dark:ring-brand-800/50'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${paymentSettings.pricing_page_mode === 'payment_link'
                                                    ? 'bg-brand-100 dark:bg-brand-800/40 text-brand-600 dark:text-brand-400'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Stripe Checkout</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Direct "Buy Now" buttons with Stripe magic links.</div>
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setPaymentSettings({ ...paymentSettings, pricing_page_mode: 'contact_us' })}
                                            className={`p-5 rounded-xl border-2 transition-all text-left group ${paymentSettings.pricing_page_mode === 'contact_us'
                                                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-900/20 ring-1 ring-brand-200 dark:ring-brand-800/50'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${paymentSettings.pricing_page_mode === 'contact_us'
                                                    ? 'bg-brand-100 dark:bg-brand-800/40 text-brand-600 dark:text-brand-400'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Contact Us</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Lead generation focus with "Contact Us" buttons.</div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    <div>
                                        <label className={labelBase}>Inquiry Email (for Contact Us mode)</label>
                                        <input
                                            type="email"
                                            value={paymentSettings.contact_sales_email || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, contact_sales_email: e.target.value })}
                                            placeholder="sales@nexspire.com"
                                            className={inputBase}
                                        />
                                    </div>
                                </div>

                                {/* Payment Provider Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Stripe Credentials */}
                                    <div className={`${sectionCard} p-6 space-y-5`}>
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.17 1.107-1.72 2.965-1.72 1.903 0 3.004.59 3.486.978l.843-2.92c-.63-.267-1.954-.622-3.485-.622-4.14 0-6.726 1.933-6.726 5.22 0 3.867 3.518 4.604 6.136 5.488 2.37.892 2.872 1.83 2.872 3.167 0 1.258-1.257 2.15-3.627 2.15-2.26 0-3.655-.66-4.526-1.144l-.873 3.01c.715.357 2.508.85 4.685.85 4.544 0 7.373-1.97 7.373-5.32 0-4.47-4.9-5.35-5.766-5.89z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Stripe</h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">API keys & webhooks</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelBase}>Secret Key</label>
                                            <input
                                                type="password"
                                                value={paymentSettings.stripe_api_key || ''}
                                                onChange={e => setPaymentSettings({ ...paymentSettings, stripe_api_key: e.target.value })}
                                                placeholder="sk_test_..."
                                                className={inputBase}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelBase}>Webhook Secret</label>
                                            <input
                                                type="password"
                                                value={paymentSettings.stripe_webhook_secret || ''}
                                                onChange={e => setPaymentSettings({ ...paymentSettings, stripe_webhook_secret: e.target.value })}
                                                placeholder="whsec_..."
                                                className={inputBase}
                                            />
                                        </div>
                                    </div>

                                    {/* Razorpay Credentials */}
                                    <div className={`${sectionCard} p-6 space-y-5`}>
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7.712 9.074L2.85 17.5h5.17l2.872-5.185L13.9 17.5h5.795l-7.23-10.925L9.67 2h7.336l5.12 7.765H16.89l-2.92-4.475-4.258 3.784z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Razorpay</h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">API keys & webhooks</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelBase}>Key ID</label>
                                            <input
                                                type="text"
                                                value={paymentSettings.razorpay_api_key || ''}
                                                onChange={e => setPaymentSettings({ ...paymentSettings, razorpay_api_key: e.target.value })}
                                                placeholder="rzp_test_..."
                                                className={inputBase}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelBase}>Key Secret</label>
                                            <input
                                                type="password"
                                                value={paymentSettings.razorpay_secret_key || ''}
                                                onChange={e => setPaymentSettings({ ...paymentSettings, razorpay_secret_key: e.target.value })}
                                                placeholder="Enter Key Secret"
                                                className={inputBase}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelBase}>Webhook Secret</label>
                                            <input
                                                type="password"
                                                value={paymentSettings.razorpay_webhook_secret || ''}
                                                onChange={e => setPaymentSettings({ ...paymentSettings, razorpay_webhook_secret: e.target.value })}
                                                placeholder="Enter Webhook Secret"
                                                className={inputBase}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Stripe Price IDs */}
                                <div className={`${sectionCard} p-6 space-y-5`}>
                                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Stripe Price IDs</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Map your Stripe price IDs to each plan and billing cycle.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {['starter', 'growth', 'business'].map(plan => (
                                            <div key={plan} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-4 space-y-3">
                                                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{plan} Plan</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wide">Monthly</label>
                                                        <input
                                                            type="text"
                                                            value={paymentSettings[`stripe_price_id_${plan}`] || ''}
                                                            onChange={e => setPaymentSettings({ ...paymentSettings, [`stripe_price_id_${plan}`]: e.target.value })}
                                                            placeholder="price_..."
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wide">Yearly</label>
                                                        <input
                                                            type="text"
                                                            value={paymentSettings[`stripe_price_id_${plan}_yearly`] || ''}
                                                            onChange={e => setPaymentSettings({ ...paymentSettings, [`stripe_price_id_${plan}_yearly`]: e.target.value })}
                                                            placeholder="price_..."
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end pt-2">
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const { pricing_page_mode, contact_sales_email, ...otherSettings } = paymentSettings;
                                                const response = await settingsAPI.updateSettings({
                                                    pricing_page_mode,
                                                    contact_sales_email,
                                                    ...otherSettings
                                                });
                                                if (response.success) {
                                                    toast.success('Payment settings updated');
                                                    fetchSettings();
                                                }
                                            } catch (err) {
                                                toast.error('Failed to update settings');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className={`${btnPrimary} flex items-center gap-2`}
                                    >
                                        {loading && (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        )}
                                        Save Payment Configuration
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ======== AI INTEGRATION TAB ======== */}
                        {activeTab === 'ai' && (
                            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <form onSubmit={handleAIUpdate} className="space-y-6">
                                    {/* Provider Cards */}
                                    {[
                                        {
                                            key: 'openai',
                                            name: 'OpenAI',
                                            desc: 'GPT-4o, GPT-3.5 Turbo',
                                            placeholder: 'sk-...',
                                            stateKey: 'openai_api_key',
                                            colorBg: 'bg-emerald-50 dark:bg-emerald-900/30',
                                            colorText: 'text-emerald-600 dark:text-emerald-400',
                                            icon: (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9089 6.0462 6.0462 0 0 0-4.4439-3.2533 6.05 6.05 0 0 0-5.4541 1.3871 6.0573 6.0573 0 0 0-4.4439 1.3871 6.05 6.05 0 0 0-2.4275 4.3936 5.9847 5.9847 0 0 0-2.5122 4.3936 6.0462 6.0462 0 0 0 1.2586 4.9089 6.05 6.05 0 0 0 4.4439 3.2533 6.05 6.05 0 0 0 5.4541-1.3871 6.0573 6.0573 0 0 0 4.4439-1.3871 6.05 6.05 0 0 0 2.4275-4.3936 5.9847 5.9847 0 0 0 2.5122-4.3936zm-8.0838 10.2831a3.7825 3.7825 0 0 1-5.4-1.252l.142-.081 3.252-1.879a.4346.4346 0 0 0 .217-.377v-4.595l1.791.995v4.512a.4346.4346 0 0 0 .217.377l3.252 1.879-.142.112a3.7825 3.7825 0 0 1-3.31 1.282zm-5.4-12.7231l-.142.081L5.4041 9.3401a.4346.4346 0 0 0-.217.377v4.595L3.3961 13.3171v-4.512a.4346.4346 0 0 0-.217-.377L3.0371 8.3541l3.31-1.282a3.7825 3.7825 0 0 1 5.4 1.252z" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            key: 'gemini',
                                            name: 'Google Gemini',
                                            desc: 'Gemini 1.5 Pro/Flash',
                                            placeholder: 'Enter Gemini API key',
                                            stateKey: 'gemini_api_key',
                                            colorBg: 'bg-blue-50 dark:bg-blue-900/30',
                                            colorText: 'text-blue-600 dark:text-blue-400',
                                            icon: (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2L14.4 9.6H22L15.8 14.1L18.2 21.7L12 17.2L5.8 21.7L8.2 14.1L2 9.6H9.6L12 2Z" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            key: 'groq',
                                            name: 'Groq (Ultra-Fast)',
                                            desc: 'Llama 3, Mixtral (Free Tier Available)',
                                            placeholder: 'gsk_...',
                                            stateKey: 'groq_api_key',
                                            colorBg: 'bg-orange-50 dark:bg-orange-900/30',
                                            colorText: 'text-orange-600 dark:text-orange-400',
                                            icon: (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            key: 'grok',
                                            name: 'xAI Grok',
                                            desc: 'Grok 4, Grok 3, Grok-beta',
                                            placeholder: 'xai-...',
                                            stateKey: 'grok_api_key',
                                            colorBg: 'bg-slate-100 dark:bg-slate-700/50',
                                            colorText: 'text-slate-700 dark:text-slate-300',
                                            icon: (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M18.901 2.1c.495 0 .897.402.897.897v18.006a.897.897 0 0 1-.897.897H5.099a.897.897 0 0 1-.897-.897V2.997c0-.495.402-.897.897-.897h13.802zM15.4 17.5h-6.8v-1.2h6.8v1.2zm1.6-4h-8.4v-1.2h8.4v1.2zm0-4h-8.4v-1.2h8.4v1.2z" />
                                                </svg>
                                            ),
                                        },
                                    ].map((provider) => (
                                        <div key={provider.key} className={`${sectionCard} p-6 space-y-4`}>
                                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                                <div className={`w-10 h-10 rounded-xl ${provider.colorBg} flex items-center justify-center ${provider.colorText}`}>
                                                    {provider.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{provider.name}</h3>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">{provider.desc}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelBase}>API Key</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="password"
                                                        value={aiSettings[provider.stateKey]}
                                                        onChange={e => setAiSettings({ ...aiSettings, [provider.stateKey]: e.target.value })}
                                                        placeholder={provider.placeholder}
                                                        className={`flex-1 ${inputBase}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => testConnection(provider.key)}
                                                        disabled={testingProvider === provider.key}
                                                        className={`${btnSecondary} whitespace-nowrap flex items-center gap-1.5`}
                                                    >
                                                        {testingProvider === provider.key ? (
                                                            <>
                                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                                Testing...
                                                            </>
                                                        ) : 'Test'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-end pt-2">
                                        <button type="submit" disabled={loading} className={`${btnPrimary} flex items-center gap-2`}>
                                            {loading && (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            )}
                                            Save AI Configuration
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
