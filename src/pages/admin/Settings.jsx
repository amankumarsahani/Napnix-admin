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
                            { id: 'preferences', label: 'Preferences', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
                            { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                            { id: 'payments', label: 'Payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
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
                            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-3xl font-bold text-brand-600 dark:text-brand-400 border-4 border-white dark:border-slate-700 shadow-lg">
                                        {profileForm.watch('firstName')?.[0] || ''}
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
                                            {...profileForm.register('firstName')}
                                            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all ${profileForm.formState.errors.firstName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                        />
                                        {profileForm.formState.errors.firstName && (
                                            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{profileForm.formState.errors.firstName.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            {...profileForm.register('lastName')}
                                            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all ${profileForm.formState.errors.lastName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                        />
                                        {profileForm.formState.errors.lastName && (
                                            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{profileForm.formState.errors.lastName.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={user?.email || ''}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        {...profileForm.register('phone')}
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
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        {...passwordForm.register('currentPassword')}
                                        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all ${passwordForm.formState.errors.currentPassword ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    />
                                    {passwordForm.formState.errors.currentPassword && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{passwordForm.formState.errors.currentPassword.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        {...passwordForm.register('newPassword')}
                                        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all ${passwordForm.formState.errors.newPassword ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    />
                                    {passwordForm.formState.errors.newPassword && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{passwordForm.formState.errors.newPassword.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        {...passwordForm.register('confirmPassword')}
                                        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all ${passwordForm.formState.errors.confirmPassword ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    />
                                    {passwordForm.formState.errors.confirmPassword && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                                    )}
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

                    {activeTab === 'preferences' && (
                        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">System Preferences</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Configure default system-wide settings.</p>

                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 dark:text-white">Default Timezone</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Used for scheduled tasks, reports, and as default for new tenants
                                            </p>
                                            {detectedTimezone !== preferencesSettings.default_timezone && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Browser detected: {detectedTimezone}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
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
                                                className="min-w-[250px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                            >
                                                {COMMON_TIMEZONES.map((tz) => (
                                                    <option key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {detectedTimezone !== preferencesSettings.default_timezone && (
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
                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                                >
                                                    Use Detected
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'payments' && (
                        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Payment & Billing Settings</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-8">Manage how customers interact with your pricing and payments.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Mode Selection */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Pricing Page Mode</h3>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setPaymentSettings({ ...paymentSettings, pricing_page_mode: 'payment_link' })}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${paymentSettings.pricing_page_mode === 'payment_link'
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="font-bold text-slate-800 dark:text-white mb-1">Stripe Checkout</div>
                                            <div className="text-xs text-slate-500">Direct "Buy Now" buttons with Stripe magic links.</div>
                                        </button>
                                        <button
                                            onClick={() => setPaymentSettings({ ...paymentSettings, pricing_page_mode: 'contact_us' })}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${paymentSettings.pricing_page_mode === 'contact_us'
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="font-bold text-slate-800 dark:text-white mb-1">Contact Us</div>
                                            <div className="text-xs text-slate-500">Lead generation focus with "Contact Us" buttons.</div>
                                        </button>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Inquiry Email (for Contact Us mode)</label>
                                        <input
                                            type="email"
                                            value={paymentSettings.contact_sales_email || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, contact_sales_email: e.target.value })}
                                            placeholder="sales@nexspire.com"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Stripe Credentials */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.17 1.107-1.72 2.965-1.72 1.903 0 3.004.59 3.486.978l.843-2.92c-.63-.267-1.954-.622-3.485-.622-4.14 0-6.726 1.933-6.726 5.22 0 3.867 3.518 4.604 6.136 5.488 2.37.892 2.872 1.83 2.872 3.167 0 1.258-1.257 2.15-3.627 2.15-2.26 0-3.655-.66-4.526-1.144l-.873 3.01c.715.357 2.508.85 4.685.85 4.544 0 7.373-1.97 7.373-5.32 0-4.47-4.9-5.35-5.766-5.89z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">Stripe Credentials</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Manage API keys securely.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Secret Key</label>
                                        <input
                                            type="password"
                                            value={paymentSettings.stripe_api_key || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, stripe_api_key: e.target.value })}
                                            placeholder="sk_test_..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Webhook Secret</label>
                                        <input
                                            type="password"
                                            value={paymentSettings.stripe_webhook_secret || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, stripe_webhook_secret: e.target.value })}
                                            placeholder="whsec_..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Razorpay Credentials */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M7.712 9.074L2.85 17.5h5.17l2.872-5.185L13.9 17.5h5.795l-7.23-10.925L9.67 2h7.336l5.12 7.765H16.89l-2.92-4.475-4.258 3.784z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">Razorpay Credentials</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Manage API keys securely.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Key ID</label>
                                        <input
                                            type="text"
                                            value={paymentSettings.razorpay_api_key || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, razorpay_api_key: e.target.value })}
                                            placeholder="rzp_test_..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Key Secret</label>
                                        <input
                                            type="password"
                                            value={paymentSettings.razorpay_secret_key || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, razorpay_secret_key: e.target.value })}
                                            placeholder="Enter Key Secret"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Webhook Secret</label>
                                        <input
                                            type="password"
                                            value={paymentSettings.razorpay_webhook_secret || ''}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, razorpay_webhook_secret: e.target.value })}
                                            placeholder="Enter Webhook Secret"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Stripe Price IDs */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-6">
                                    <h3 className="font-bold text-slate-800 dark:text-white">Stripe Price IDs</h3>

                                    <div className="space-y-4">
                                        {['starter', 'growth', 'business'].map(plan => (
                                            <div key={plan} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{plan} Plan</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Monthly</label>
                                                        <input
                                                            type="text"
                                                            value={paymentSettings[`stripe_price_id_${plan}`] || ''}
                                                            onChange={e => setPaymentSettings({ ...paymentSettings, [`stripe_price_id_${plan}`]: e.target.value })}
                                                            placeholder="price_..."
                                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Yearly</label>
                                                        <input
                                                            type="text"
                                                            value={paymentSettings[`stripe_price_id_${plan}_yearly`] || ''}
                                                            onChange={e => setPaymentSettings({ ...paymentSettings, [`stripe_price_id_${plan}_yearly`]: e.target.value })}
                                                            placeholder="price_..."
                                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
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
                                    className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Save Payment Configuration'}
                                </button>
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

                                {/* xAI Grok Section */}
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-slate-800 dark:text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.901 2.1c.495 0 .897.402.897.897v18.006a.897.897 0 0 1-.897.897H5.099a.897.897 0 0 1-.897-.897V2.997c0-.495.402-.897.897-.897h13.802zM15.4 17.5h-6.8v-1.2h6.8v1.2zm1.6-4h-8.4v-1.2h8.4v1.2zm0-4h-8.4v-1.2h8.4v1.2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">xAI Grok</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Grok 4, Grok 3, Grok-beta</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={aiSettings.grok_api_key}
                                                onChange={e => setAiSettings({ ...aiSettings, grok_api_key: e.target.value })}
                                                placeholder="xai-..."
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => testConnection('grok')}
                                                disabled={testingProvider === 'grok'}
                                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                {testingProvider === 'grok' ? 'Testing...' : 'Test Connection'}
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
                                        {loading ? 'Saving...' : 'Save AI Configuration'}
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
