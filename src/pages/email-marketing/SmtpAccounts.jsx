import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiServer, FiPlus, FiTrash2, FiZap, FiInfo } from '../../components/icons/FeatherIcons';
import { nmSmtpAPI } from '../../api/nexmail';

const PRESETS = [
    { name: 'Zoho India', host: 'smtp.zoho.in', port: 465, secure: true },
    { name: 'Zoho Global', host: 'smtp.zoho.com', port: 465, secure: true },
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
    { name: 'Outlook', host: 'smtp.office365.com', port: 587, secure: false },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: false },
];

const EMPTY_FORM = { name: '', host: '', port: '587', secure: false, username: '', password: '', from_email: '', from_name: '', daily_limit: '500', is_default: false };

export default function SmtpAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            const res = await nmSmtpAPI.getAll();
            setAccounts(res.data || []);
        } catch (e) {
            console.error('Fetch SMTP error:', e);
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = (preset) => {
        setForm(prev => ({ ...prev, name: preset.name, host: preset.host, port: String(preset.port), secure: preset.secure }));
    };

    const handleTest = async () => {
        if (!form.host || !form.username || !form.password) return toast.error('Host, username, and password required');
        setTesting(true);
        try {
            const res = await nmSmtpAPI.test({ host: form.host, port: parseInt(form.port), secure: form.secure, username: form.username, password: form.password });
            toast.success(res.message || 'Connection successful!');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Connection failed');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!form.host || !form.username || !form.password) return toast.error('Host, username, and password required');
        setSaving(true);
        try {
            await nmSmtpAPI.create({ ...form, port: parseInt(form.port), daily_limit: parseInt(form.daily_limit) });
            toast.success('SMTP account added');
            setShowModal(false);
            setForm(EMPTY_FORM);
            fetchAccounts();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to add account');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await nmSmtpAPI.delete(deleteTarget.id);
            toast.success('Account deleted');
            setDeleteTarget(null);
            fetchAccounts();
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SMTP Accounts</h1>
                    <p className="text-sm text-slate-500 mt-1">Configure email sending for NexMail campaigns</p>
                </div>
                <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="btn btn-primary flex items-center gap-2">
                    <FiPlus className="w-4 h-4" /> Add Account
                </button>
            </div>

            {/* Zoho Setup Guide */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <FiInfo className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold mb-1">Setting up Zoho Mail</p>
                        <ol className="text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                            <li>Click <strong>Add Account</strong> → select <strong>Zoho India</strong> preset (for <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">@zoho.in</code> or custom Zoho India domains)</li>
                            <li>Username = your full Zoho email (e.g. <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">hello@yourdomain.com</code>)</li>
                            <li>If 2FA is on → generate an <strong>App Password</strong> in Zoho → Security → App Passwords</li>
                            <li>Set <strong>From Email</strong> to the exact address you want recipients to see</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Accounts List */}
            {accounts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FiServer className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No SMTP accounts</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Add an SMTP account to start sending campaigns</p>
                    <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="btn btn-primary">Add SMTP Account</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</h3>
                                        {acc.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-900/40 dark:text-indigo-300">DEFAULT</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{acc.host}:{acc.port} · {acc.auth_user}</p>
                                    {acc.from_email && acc.from_email !== acc.auth_user && (
                                        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">Sends as: {acc.from_email}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{acc.sent_today || 0}/{acc.daily_limit} today</p>
                                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(((acc.sent_today || 0) / acc.daily_limit) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${acc.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                        {acc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button onClick={() => setDeleteTarget(acc)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {acc.warmup_mode && <p className="text-xs text-amber-600 mt-2">Warmup mode: Day {acc.warmup_day} ({acc.warmup_daily_limit}/day limit)</p>}
                            {acc.last_error && <p className="text-xs text-rose-500 mt-2">Last error: {acc.last_error}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add SMTP Account</h2>

                        {/* Presets */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 mb-2">Quick Presets</p>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map(p => (
                                    <button key={p.name} onClick={() => applyPreset(p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 transition-colors">
                                        <FiZap className="w-3 h-3" />
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                { k: 'name', label: 'Account Name', ph: 'e.g., Zoho India Main' },
                                { k: 'host', label: 'SMTP Host *', ph: 'smtp.zoho.in' },
                                { k: 'port', label: 'Port', type: 'number' },
                                { k: 'username', label: 'Username / Login Email *', ph: 'admin@yourdomain.com' },
                                { k: 'password', label: 'Password / App Password *', type: 'password', ph: 'Zoho app password or SMTP password' },
                                { k: 'from_email', label: 'From Email', ph: 'hello@yourdomain.com' },
                                { k: 'from_name', label: 'From Name', ph: 'Your Company Name' },
                                { k: 'daily_limit', label: 'Daily Send Limit', type: 'number' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                                    <input
                                        type={f.type || 'text'}
                                        value={form[f.k]}
                                        onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                                        placeholder={f.ph}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            ))}
                            <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} className="w-4 h-4 accent-indigo-600 rounded" />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Use SSL/TLS (port 465)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 accent-indigo-600 rounded" />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Set as default</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                            <button onClick={handleTest} disabled={testing} className="btn btn-secondary flex-1">{testing ? 'Testing...' : 'Test Connection'}</button>
                            <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Delete SMTP Account</h3>
                        <p className="text-sm text-slate-500 mb-5">Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">Cancel</button>
                            <button onClick={confirmDelete} className="btn btn-danger flex-1">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
