import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const EMPTY_FORM = {
    name: '',
    host: '',
    port: '587',
    secure: false,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    daily_limit: '500',
    is_default: false,
};

export default function SmtpAccounts() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const { data: accounts = [], isLoading: loading } = useQuery({
        queryKey: ['nexmail-smtp'],
        queryFn: async () => {
            const res = await nmSmtpAPI.getAll();
            return res.data || [];
        },
    });

    const applyPreset = (preset) => {
        setForm((prev) => ({
            ...prev,
            name: preset.name,
            host: preset.host,
            port: String(preset.port),
            secure: preset.secure,
        }));
    };

    const handleTest = async () => {
        if (!form.host || !form.username || !form.password) {
            return toast.error('Host, username, and password required');
        }

        setTesting(true);
        try {
            const res = await nmSmtpAPI.test({
                host: form.host,
                port: parseInt(form.port, 10),
                secure: form.secure,
                username: form.username,
                password: form.password,
            });
            toast.success(res.message || 'Connection successful!');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Connection failed');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!form.host || !form.username || !form.password) {
            return toast.error('Host, username, and password required');
        }

        setSaving(true);
        try {
            await nmSmtpAPI.create({
                ...form,
                port: parseInt(form.port, 10),
                daily_limit: parseInt(form.daily_limit, 10),
            });
            toast.success('SMTP account added');
            setShowModal(false);
            setForm(EMPTY_FORM);
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['nexmail-smtp'] });
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
            queryClient.invalidateQueries({ queryKey: ['nexmail-smtp'] });
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SMTP Accounts</h1>
                    <p className="text-sm text-slate-500 mt-1">Configure email sending for NexMail campaigns</p>
                </div>
                <button
                    onClick={() => {
                        setForm(EMPTY_FORM);
                        setShowModal(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <FiPlus className="w-4 h-4" /> Add Account
                </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <FiInfo className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold mb-1">Setting up Zoho Mail</p>
                        <ol className="text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                            <li>Click <strong>Add Account</strong> and select <strong>Zoho India</strong> for <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">@zoho.in</code> or Zoho India custom domains</li>
                            <li>Username should be the full Zoho mailbox address</li>
                            <li>If 2FA is enabled, generate an <strong>App Password</strong> in Zoho security settings</li>
                            <li>Set <strong>From Email</strong> to the exact sender address recipients should see</li>
                        </ol>
                    </div>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FiServer className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No SMTP accounts</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Add an SMTP account to start sending campaigns</p>
                    <button
                        onClick={() => {
                            setForm(EMPTY_FORM);
                            setShowModal(true);
                        }}
                        className="btn btn-primary"
                    >
                        Add SMTP Account
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((acc) => {
                        const sentToday = acc.sent_today || 0;
                        const dailyLimit = acc.daily_limit || 1;
                        const progress = Math.min((sentToday / dailyLimit) * 100, 100);

                        return (
                            <div key={acc.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</h3>
                                            {acc.is_default && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 font-bold dark:bg-brand-900/40 dark:text-brand-300">
                                                    DEFAULT
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{acc.host}:{acc.port} · {acc.auth_user}</p>
                                        {acc.from_email && acc.from_email !== acc.auth_user && (
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">Sends as: {acc.from_email}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">{sentToday}/{acc.daily_limit} today</p>
                                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }} />
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
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add SMTP Account</h2>

                        <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 mb-2">Quick Presets</p>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyPreset(preset)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30 dark:hover:text-brand-300 transition-colors"
                                    >
                                        <FiZap className="w-3 h-3" />
                                        {preset.name}
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
                            ].map((field) => (
                                <div key={field.k}>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">{field.label}</label>
                                    <input
                                        type={field.type || 'text'}
                                        value={form[field.k]}
                                        onChange={(e) => setForm({ ...form, [field.k]: e.target.value })}
                                        placeholder={field.ph}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            ))}
                            <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.secure}
                                        onChange={(e) => setForm({ ...form, secure: e.target.checked })}
                                        className="w-4 h-4 accent-brand-600 rounded"
                                    />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Use SSL/TLS (port 465)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_default}
                                        onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                                        className="w-4 h-4 accent-brand-600 rounded"
                                    />
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

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
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
