import { useState, useEffect } from 'react';
import { smtpAccountsAPI } from '../../api';
import toast from 'react-hot-toast';

// Provider presets with SMTP settings
const PROVIDER_PRESETS = [
    { id: '', name: 'Custom / Other', host: '', port: 587, secure: false },
    { id: 'gmail', name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false, note: 'Use App Password, not regular password' },
    { id: 'gmail_ssl', name: 'Gmail (SSL)', host: 'smtp.gmail.com', port: 465, secure: true, note: 'Use App Password' },
    { id: 'outlook', name: 'Outlook / Hotmail', host: 'smtp.office365.com', port: 587, secure: false },
    { id: 'yahoo', name: 'Yahoo Mail', host: 'smtp.mail.yahoo.com', port: 587, secure: false },
    { id: 'zoho', name: 'Zoho Mail', host: 'smtp.zoho.com', port: 587, secure: false },
    { id: 'sendgrid', name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false, note: 'Username: apikey, Password: your API key' },
    { id: 'mailgun', name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: false },
    { id: 'ses', name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, secure: false, note: 'Use IAM SMTP credentials' },
    { id: 'postmark', name: 'Postmark', host: 'smtp.postmarkapp.com', port: 587, secure: false },
    { id: 'brevo', name: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: 587, secure: false },
    { id: 'hostinger', name: 'Hostinger', host: 'smtp.hostinger.com', port: 465, secure: true },
    { id: 'godaddy', name: 'GoDaddy', host: 'smtpout.secureserver.net', port: 465, secure: true },
];

const SmtpAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [testingId, setTestingId] = useState(null);

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const res = await smtpAccountsAPI.getAll();
            setAccounts(res.data || []);
        } catch (error) {
            toast.error('Failed to fetch SMTP accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this SMTP account?')) return;
        try {
            await smtpAccountsAPI.delete(id);
            toast.success('Account deleted');
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    const handleTest = async (id) => {
        setTestingId(id);
        try {
            await smtpAccountsAPI.test(id);
            toast.success('Connection successful!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Connection failed');
        } finally {
            setTestingId(null);
        }
    };

    const handleToggleActive = async (account) => {
        try {
            await smtpAccountsAPI.update(account.id, { is_active: !account.is_active });
            toast.success(account.is_active ? 'Account disabled' : 'Account enabled');
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to update account');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SMTP Accounts</h1>
                    <p className="text-slate-500 dark:text-slate-400">Configure email sending accounts</p>
                </div>
                <button onClick={() => { setSelectedAccount(null); setShowModal(true); }}
                    className="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Account
                </button>
            </div>

            {/* Info about .env fallback */}
            {accounts.length === 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> If no SMTP accounts are configured, the system will use SMTP settings from environment variables (SMTP_HOST, SMTP_USER, etc.) as a fallback.
                    </p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {accounts.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No SMTP accounts configured.</div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {accounts.map((account) => (
                            <div key={account.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-900 dark:text-white">{account.name}</span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {account.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">{account.from_email} | {account.host}:{account.port}</p>
                                    <p className="text-xs text-slate-400">Hourly: {account.sent_this_hour || 0}/{account.hourly_limit}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleTest(account.id)} disabled={testingId === account.id}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Test">
                                        {testingId === account.id ? (
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button onClick={() => handleToggleActive(account)}
                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title={account.is_active ? 'Disable' : 'Enable'}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {account.is_active ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            )}
                                        </svg>
                                    </button>
                                    <button onClick={() => { setSelectedAccount(account); setShowModal(true); }}
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(account.id)}
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && <SmtpModal account={selectedAccount} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchAccounts(); }} />}
        </div>
    );
};

const SmtpModal = ({ account, onClose, onSaved }) => {
    const [selectedProvider, setSelectedProvider] = useState('');
    const [formData, setFormData] = useState({
        name: account?.name || '',
        host: account?.host || '',
        port: account?.port || 587,
        secure: account?.secure || false,
        username: account?.username || '',
        password: '',
        from_name: account?.from_name || '',
        from_email: account?.from_email || '',
        daily_limit: account?.daily_limit || 500,
        hourly_limit: account?.hourly_limit || 50,
        priority: account?.priority || 1
    });
    const [loading, setLoading] = useState(false);
    const [providerNote, setProviderNote] = useState('');

    const handleProviderSelect = (providerId) => {
        setSelectedProvider(providerId);
        const preset = PROVIDER_PRESETS.find(p => p.id === providerId);
        if (preset && providerId) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || preset.name,
                host: preset.host,
                port: preset.port,
                secure: preset.secure
            }));
            setProviderNote(preset.note || '');
        } else {
            setProviderNote('');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...formData };
            if (account?.id && !data.password) delete data.password;
            if (account?.id) await smtpAccountsAPI.update(account.id, data);
            else await smtpAccountsAPI.create(data);
            toast.success(account?.id ? 'Updated!' : 'Created!');
            onSaved();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{account?.id ? 'Edit' : 'Add'} SMTP Account</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Provider Preset Selector */}
                    {!account?.id && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Provider
                            </label>
                            <select
                                value={selectedProvider}
                                onChange={(e) => handleProviderSelect(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                {PROVIDER_PRESETS.map(provider => (
                                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                                ))}
                            </select>
                            {providerNote && (
                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{providerNote}</p>
                            )}
                        </div>
                    )}

                    <input name="name" value={formData.name} onChange={handleChange} required placeholder="Account Name"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />

                    <div className="grid grid-cols-2 gap-4">
                        <input name="host" value={formData.host} onChange={handleChange} required placeholder="SMTP Host"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                        <input name="port" type="number" value={formData.port} onChange={handleChange} placeholder="Port"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                    </div>

                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="secure" checked={formData.secure} onChange={handleChange} className="rounded" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Use SSL/TLS (port 465)</span>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <input name="username" value={formData.username} onChange={handleChange} required placeholder="Username / Email"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                        <input name="password" type="password" value={formData.password} onChange={handleChange}
                            required={!account?.id} placeholder={account?.id ? '••••••••' : 'Password / App Password'}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input name="from_name" value={formData.from_name} onChange={handleChange} required placeholder="From Name"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                        <input name="from_email" type="email" value={formData.from_email} onChange={handleChange} required placeholder="From Email"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Hourly Limit</label>
                            <input name="hourly_limit" type="number" value={formData.hourly_limit} onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Daily Limit</label>
                            <input name="daily_limit" type="number" value={formData.daily_limit} onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Priority</label>
                            <input name="priority" type="number" value={formData.priority} onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                            {loading && (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            )}
                            {account?.id ? 'Save Changes' : 'Add Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SmtpAccounts;
