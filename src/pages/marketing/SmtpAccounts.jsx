import { useState, useEffect } from 'react';
import { smtpAccountsAPI } from '../../api';
import toast from 'react-hot-toast';

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
                                    <p className="text-xs text-slate-400">Hourly: {account.sent_this_hour}/{account.hourly_limit}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleTest(account.id)} disabled={testingId === account.id}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Test">
                                        {testingId === account.id ? '...' : '✓'}
                                    </button>
                                    <button onClick={() => handleToggleActive(account)}
                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">
                                        {account.is_active ? '⏸' : '▶'}
                                    </button>
                                    <button onClick={() => { setSelectedAccount(account); setShowModal(true); }}
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">✎</button>
                                    <button onClick={() => handleDelete(account.id)}
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">✕</button>
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
    const [formData, setFormData] = useState({
        name: account?.name || '', host: account?.host || '', port: account?.port || 587,
        secure: account?.secure || false, username: account?.username || '', password: '',
        from_name: account?.from_name || '', from_email: account?.from_email || '',
        daily_limit: account?.daily_limit || 500, hourly_limit: account?.hourly_limit || 50, priority: account?.priority || 1
    });
    const [loading, setLoading] = useState(false);

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
                    <button onClick={onClose} className="text-slate-500">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} required placeholder="Account Name"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="host" value={formData.host} onChange={handleChange} required placeholder="SMTP Host"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                        <input name="port" type="number" value={formData.port} onChange={handleChange} placeholder="Port"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="secure" checked={formData.secure} onChange={handleChange} />
                        <span className="text-sm text-slate-600">Use SSL/TLS</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="username" value={formData.username} onChange={handleChange} required placeholder="Username"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                        <input name="password" type="password" value={formData.password} onChange={handleChange}
                            required={!account?.id} placeholder={account?.id ? '••••••••' : 'Password'}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="from_name" value={formData.from_name} onChange={handleChange} required placeholder="From Name"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                        <input name="from_email" type="email" value={formData.from_email} onChange={handleChange} required placeholder="From Email"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <input name="hourly_limit" type="number" value={formData.hourly_limit} onChange={handleChange} placeholder="Hourly Limit"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                        <input name="daily_limit" type="number" value={formData.daily_limit} onChange={handleChange} placeholder="Daily Limit"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                        <input name="priority" type="number" value={formData.priority} onChange={handleChange} placeholder="Priority"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
                            {loading ? '...' : (account?.id ? 'Save' : 'Add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SmtpAccounts;
