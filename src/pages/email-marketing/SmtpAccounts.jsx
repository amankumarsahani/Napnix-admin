import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiServer, FiPlus } from '../../components/icons/FeatherIcons';
import { nmSmtpAPI } from '../../api/nexmail';

export default function SmtpAccounts() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', host: '', port: '587', secure: false, username: '', password: '', from_email: '', from_name: '', daily_limit: '500', is_default: false });

    const { data: accounts = [], isLoading: loading } = useQuery({
        queryKey: ['nexmail-smtp'],
        queryFn: async () => {
            const res = await nmSmtpAPI.getAll();
            return res.data || [];
        },
    });

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
            setForm({ name: '', host: '', port: '587', secure: false, username: '', password: '', from_email: '', from_name: '', daily_limit: '500', is_default: false });
            queryClient.invalidateQueries({ queryKey: ['nexmail-smtp'] });
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to add account');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this SMTP account?')) return;
        try {
            await nmSmtpAPI.delete(id);
            toast.success('Account deleted');
            queryClient.invalidateQueries({ queryKey: ['nexmail-smtp'] });
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">SMTP Accounts</h1><p className="text-sm text-slate-500 mt-1">Configure email sending for NexMail</p></div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add Account</button>
            </div>

            {accounts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FiServer className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No SMTP accounts</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Add an SMTP account to start sending emails</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">Add SMTP Account</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</h3>
                                        {acc.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">DEFAULT</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{acc.host}:{acc.port} &middot; {acc.auth_user}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{acc.sent_today}/{acc.daily_limit} today</p>
                                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((acc.sent_today / acc.daily_limit) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${acc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{acc.is_active ? 'Active' : 'Inactive'}</span>
                                    <button onClick={() => handleDelete(acc.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                </div>
                            </div>
                            {acc.warmup_mode && <p className="text-xs text-amber-600 mt-2">Warmup mode: Day {acc.warmup_day} ({acc.warmup_daily_limit}/day limit)</p>}
                            {acc.last_error && <p className="text-xs text-red-500 mt-2">Last error: {acc.last_error}</p>}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add SMTP Account</h2>
                        <div className="space-y-3">
                            {[
                                { k: 'name', label: 'Account Name', ph: 'e.g., Gmail Main' },
                                { k: 'host', label: 'SMTP Host *', ph: 'smtp.gmail.com' },
                                { k: 'port', label: 'Port', type: 'number' },
                                { k: 'username', label: 'Username *', ph: 'your@email.com' },
                                { k: 'password', label: 'Password *', type: 'password', ph: 'App password or SMTP password' },
                                { k: 'from_email', label: 'From Email', ph: 'noreply@yourdomain.com' },
                                { k: 'from_name', label: 'From Name', ph: 'Your Company' },
                                { k: 'daily_limit', label: 'Daily Limit', type: 'number' },
                            ].map(f => (
                                <div key={f.k}><label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label><input type={f.type || 'text'} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.ph} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                            ))}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} id="ssl" />
                                <label htmlFor="ssl" className="text-xs text-slate-600">Use SSL/TLS (port 465)</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} id="default" />
                                <label htmlFor="default" className="text-xs text-slate-600">Set as default account</label>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                            <button onClick={handleTest} disabled={testing} className="btn btn-secondary flex-1">{testing ? 'Testing...' : 'Test'}</button>
                            <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
