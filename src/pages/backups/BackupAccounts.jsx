import React, { useState, useEffect, useMemo } from 'react';
import { FiHardDrive, FiPlus, FiRefreshCw, FiTrash2, FiKey, FiFolder, FiEdit2, FiX, FiCheckCircle, FiServer } from '../../components/icons/FeatherIcons';
import serverService from '../../api/admin';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const GOOGLE_OAUTH_SESSION_KEY = 'nexs_admin_backup_oauth';

const EMPTY_FORM = {
    auth_type: 'oauth_personal',
    account_name: '',
    folder_id: '',
    subject_email: '',
    credentials_json: '{\n  \n}',
    oauth_client_id: '',
    oauth_client_secret: '',
    oauth_refresh_token: '',
};

function safePrettyJson(value) {
    if (!value) return '{\n  \n}';
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return JSON.stringify(parsed, null, 2);
    } catch {
        return typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2);
    }
}

const BackupAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [editingAccountMeta, setEditingAccountMeta] = useState(null);
    const [saving, setSaving] = useState(false);
    const [oauthConnecting, setOauthConnecting] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false });

    const stats = useMemo(() => ({
        total: accounts.length,
        active: accounts.filter(a => a.is_active).length,
        personal: accounts.filter(a => a.auth_type === 'oauth_personal').length,
        service: accounts.filter(a => a.auth_type !== 'oauth_personal').length,
    }), [accounts]);

    const getRedirectUri = () => `${window.location.origin}/infrastructure/backups`;
    const hasStoredOauthClientSecret = Boolean(editingId && editingAccountMeta?.oauth_client_secret_configured);
    const hasStoredOauthRefreshToken = Boolean(editingId && editingAccountMeta?.oauth_refresh_token_configured);
    const hasStoredCredentialsJson = Boolean(editingId && editingAccountMeta?.credentials_configured);

    const clearOAuthParams = () => {
        const url = new URL(window.location.href);
        ['code', 'scope', 'state', 'error', 'prompt'].forEach(p => url.searchParams.delete(p));
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    };

    const fetchAccounts = async () => {
        try {
            const res = await serverService.getAllBackupAccounts();
            if (res.success) setAccounts(res.data);
        } catch {
            toast.error('Failed to load backup accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    // Restore pending form from sessionStorage after Google redirect
    useEffect(() => {
        const raw = sessionStorage.getItem(GOOGLE_OAUTH_SESSION_KEY);
        if (!raw) return;
        try {
            const pending = JSON.parse(raw);
            if (pending?.form) {
                setFormData(prev => {
                    const isPristine = JSON.stringify(prev) === JSON.stringify(EMPTY_FORM);
                    return isPristine ? { ...EMPTY_FORM, ...pending.form } : prev;
                });
            }
            if (pending?.editingId) setEditingId(prev => prev || pending.editingId);
        } catch {
            sessionStorage.removeItem(GOOGLE_OAUTH_SESSION_KEY);
        }
    }, []);

    // Handle Google OAuth code exchange after redirect back
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        if (!code && !error) return;

        const runExchange = async () => {
            const raw = sessionStorage.getItem(GOOGLE_OAUTH_SESSION_KEY);

            if (error) {
                clearOAuthParams();
                toast.error(`Google OAuth failed: ${error}`);
                return;
            }

            if (!raw) {
                clearOAuthParams();
                toast.error('OAuth session data missing. Start the Connect Google Drive flow again.');
                return;
            }

            let pending;
            try { pending = JSON.parse(raw); } catch {
                sessionStorage.removeItem(GOOGLE_OAUTH_SESSION_KEY);
                clearOAuthParams();
                toast.error('OAuth session data was invalid.');
                return;
            }

            if (!pending?.state || pending.state !== state) {
                sessionStorage.removeItem(GOOGLE_OAUTH_SESSION_KEY);
                clearOAuthParams();
                toast.error('OAuth state mismatch. Start the flow again.');
                return;
            }

            setOauthConnecting(true);
            setIsModalOpen(true);
            if (pending.form) setFormData({ ...EMPTY_FORM, ...pending.form });
            if (pending.editingId) setEditingId(pending.editingId);

            try {
                const clientSecret = pending.form.oauth_client_secret || '';
                const canReuseStoredSecret = Boolean(pending.editingId);

                if (!clientSecret && !canReuseStoredSecret) {
                    toast.error('OAuth client secret missing. Enter it once or reconnect from an account that already has it stored.');
                    return;
                }

                const res = await serverService.exchangeGoogleOauthCode({
                    account_id: pending.editingId || undefined,
                    client_id: pending.form.oauth_client_id,
                    client_secret: clientSecret,
                    code,
                    redirect_uri: getRedirectUri(),
                });
                const refreshToken = res.data?.refresh_token || res.refresh_token || '';
                const email = res.data?.email || res.email || '';
                setFormData(prev => ({ ...prev, ...pending.form, oauth_refresh_token: refreshToken }));
                toast.success(email
                    ? `✅ Google Drive connected (${email}). Save the account to persist the refresh token.`
                    : '✅ Google Drive connected. Save the account to persist the refresh token.');
            } catch (err) {
                toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to exchange Google OAuth code.');
            } finally {
                setOauthConnecting(false);
                sessionStorage.removeItem(GOOGLE_OAUTH_SESSION_KEY);
                clearOAuthParams();
            }
        };

        runExchange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setEditingAccountMeta(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setEditingAccountMeta(null);
    };

    const handleEdit = (account) => {
        const authType = account.auth_type === 'oauth_personal' ? 'oauth_personal' : 'service_account';
        setEditingAccountMeta(account);
        setFormData({
            auth_type: authType,
            account_name: account.account_name || '',
            folder_id: account.folder_id || '',
            subject_email: account.subject_email || '',
            credentials_json: '',
            oauth_client_id: account.oauth_client_id || '',
            oauth_client_secret: '',
            oauth_refresh_token: '',
        });
        setEditingId(account.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Backup Account',
            message: 'Are you sure you want to delete this backup account? Scheduled backups using this account will stop.',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                try {
                    const res = await serverService.deleteBackupAccount(id);
                    if (res.success) { toast.success('Account deleted'); fetchAccounts(); }
                } catch { toast.error('Failed to delete account'); }
            },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const authType = formData.auth_type;

        try {
            let payload;
            if (authType === 'oauth_personal') {
                payload = {
                    auth_type: 'oauth_personal',
                    account_name: formData.account_name.trim(),
                    folder_id: formData.folder_id.trim(),
                    subject_email: '',
                    credentials_json: null,
                    oauth_client_id: formData.oauth_client_id.trim(),
                    oauth_client_secret: formData.oauth_client_secret.trim(),
                    oauth_refresh_token: formData.oauth_refresh_token.trim(),
                };
            } else {
                let json = null;
                if (formData.credentials_json.trim()) {
                    try { json = JSON.parse(formData.credentials_json); } catch {
                        toast.error('Invalid JSON in credentials field');
                        setSaving(false);
                        return;
                    }
                } else if (!hasStoredCredentialsJson) {
                    toast.error('Service account credentials are required.');
                    setSaving(false);
                    return;
                }
                payload = {
                    auth_type: 'service_account',
                    account_name: formData.account_name.trim(),
                    folder_id: formData.folder_id.trim(),
                    subject_email: formData.subject_email.trim(),
                    credentials_json: json,
                    oauth_client_id: '',
                    oauth_client_secret: '',
                    oauth_refresh_token: '',
                };
            }

            let res;
            if (editingId) {
                res = await serverService.updateBackupAccount(editingId, payload);
            } else {
                res = await serverService.createBackupAccount(payload);
            }
            if (res.success) {
                toast.success(editingId ? 'Account updated' : 'Backup account added');
                closeModal();
                fetchAccounts();
            }
        } catch {
            toast.error('Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    const handleRunBackup = () => {
        setConfirmState({
            isOpen: true,
            title: 'Trigger Manual Backup',
            message: 'This will trigger a manual backup for ALL tenants. This may affect performance while the backup is running.',
            variant: 'warning',
            confirmText: 'Start Backup',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                const id = toast.loading('Starting backup...');
                try {
                    const res = await serverService.triggerManualBackup();
                    if (res.success) toast.success('Backup started in background', { id });
                } catch { toast.error('Failed to start backup', { id }); }
            },
        });
    };

    const handleConnectGoogleDrive = () => {
        if (!formData.oauth_client_id.trim()) {
            toast.error('Enter OAuth Client ID first.');
            return;
        }
        if (!formData.oauth_client_secret.trim() && !hasStoredOauthClientSecret) {
            toast.error('Enter OAuth Client Secret first.');
            return;
        }
        const state = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(GOOGLE_OAUTH_SESSION_KEY, JSON.stringify({
            state,
            editingId,
            form: {
                ...formData,
                oauth_client_secret: formData.oauth_client_secret.trim(),
            }
        }));
        const params = new URLSearchParams({
            client_id: formData.oauth_client_id.trim(),
            redirect_uri: getRedirectUri(),
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email',
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
            state,
        });
        window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Backup Infrastructure</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage Google Drive accounts for automated tenant backups</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRunBackup}
                        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition text-sm font-medium"
                    >
                        <FiRefreshCw /> Run Backup Now
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                        <FiPlus /> Add GDrive Account
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Accounts', value: stats.total, icon: <FiHardDrive />, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
                    { label: 'Active', value: stats.active, icon: <FiCheckCircle />, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                    { label: 'Personal OAuth', value: stats.personal, icon: <FiKey />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Service Account', value: stats.service, icon: <FiServer />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
                        <div className={`inline-flex p-2 rounded-lg mb-3 ${s.color}`}>{s.icon}</div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Account Cards */}
            {loading ? (
                <div className="flex justify-center p-16">
                    <FiRefreshCw className="animate-spin text-4xl text-green-600" />
                </div>
            ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full mb-4">
                        <FiHardDrive className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Backup Accounts</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                        Connect a Google Drive account (Personal OAuth or Service Account) to enable automated backups.
                    </p>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        <FiPlus /> Connect First Account
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {accounts.map(account => {
                        const isPersonal = account.auth_type === 'oauth_personal';
                        let clientEmail = '';
                        if (!isPersonal) {
                            try {
                                const creds = typeof account.credentials_json === 'string'
                                    ? JSON.parse(account.credentials_json) : account.credentials_json;
                                clientEmail = creds?.client_email || '';
                            } catch { clientEmail = ''; }
                        }

                        return (
                            <div key={account.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 relative group">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(account)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Edit">
                                        <FiEdit2 size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(account.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>

                                <div className="flex items-start gap-3 mb-4">
                                    <div className={`p-3 rounded-lg ${isPersonal ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                                        <FiHardDrive size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{account.account_name}</h3>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${account.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPersonal ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                {isPersonal ? 'Personal OAuth' : 'Service Account'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {account.folder_id && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <FiFolder size={13} className="shrink-0 text-slate-400" />
                                            <span className="truncate">Folder: {account.folder_id}</span>
                                        </div>
                                    )}
                                    {isPersonal ? (
                                        <>
                                            {account.oauth_client_id && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <FiKey size={13} className="shrink-0 text-slate-400" />
                                                    <span className="truncate">Client ID: {account.oauth_client_id.slice(0, 20)}…</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm">
                                                <FiCheckCircle size={13} className={`shrink-0 ${account.oauth_refresh_token ? 'text-green-500' : 'text-amber-500'}`} />
                                                <span className={account.oauth_refresh_token ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                                                    {account.oauth_refresh_token ? 'Refresh token stored' : 'Refresh token missing'}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {clientEmail && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <FiKey size={13} className="shrink-0 text-slate-400" />
                                                    <span className="truncate">{clientEmail}</span>
                                                </div>
                                            )}
                                            {account.subject_email && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-400 shrink-0">↳</span>
                                                    <span className="truncate">Impersonating: {account.subject_email}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <FiRefreshCw size={13} className="shrink-0 text-slate-400" />
                                        <span>Used for <strong className="text-slate-900 dark:text-white">{account.usage_count ?? 0}</strong> backups</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center z-[60] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700 my-8">
                        {/* Modal header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <FiKey className="text-amber-500" />
                                {editingId ? 'Edit Backup Account' : 'Connect Google Drive Account'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                                <FiX />
                            </button>
                        </div>

                        {oauthConnecting && (
                            <div className="mb-5 flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                                <FiRefreshCw className="animate-spin shrink-0" />
                                Exchanging Google OAuth code — please wait…
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Auth mode selector */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Authentication Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'oauth_personal', title: 'Personal Drive OAuth', desc: '@gmail.com Drive via OAuth client ID + refresh token' },
                                        { value: 'service_account', title: 'Service Account', desc: 'Google Workspace / Shared Drive via JSON key file' },
                                    ].map(opt => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, auth_type: opt.value }))}
                                            className={`rounded-xl border p-3 text-left transition-all ${formData.auth_type === opt.value
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/20'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}
                                        >
                                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{opt.title}</span>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Account name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Label</label>
                                <input type="text" required value={formData.account_name}
                                    onChange={e => setFormData(p => ({ ...p, account_name: e.target.value }))}
                                    placeholder="e.g. My Primary GDrive"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400" />
                            </div>

                            {/* Folder ID */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Drive Folder ID</label>
                                <input type="text" required value={formData.folder_id}
                                    onChange={e => setFormData(p => ({ ...p, folder_id: e.target.value }))}
                                    placeholder="Google Drive Folder ID"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono placeholder-slate-400" />
                            </div>

                            {/* --- Personal OAuth fields --- */}
                            {formData.auth_type === 'oauth_personal' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">OAuth Client ID</label>
                                            <input type="text" required value={formData.oauth_client_id}
                                                onChange={e => setFormData(p => ({ ...p, oauth_client_id: e.target.value }))}
                                                placeholder="…apps.googleusercontent.com"
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">OAuth Client Secret</label>
                                            <input type="text" required={!hasStoredOauthClientSecret} value={formData.oauth_client_secret}
                                                onChange={e => setFormData(p => ({ ...p, oauth_client_secret: e.target.value }))}
                                                placeholder="GOCSPX-…"
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 text-sm" />
                                            {hasStoredOauthClientSecret && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Leave blank to reuse the OAuth client secret already stored in the backend.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Redirect URI info */}
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Authorized Redirect URI — add this in Google Cloud Console:</p>
                                        <p className="font-mono break-all">{getRedirectUri()}</p>
                                    </div>

                                    {/* Connect button */}
                                    <button type="button" onClick={handleConnectGoogleDrive} disabled={oauthConnecting}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition disabled:opacity-60">
                                        🔗 {oauthConnecting ? 'Connecting…' : 'Connect Google Drive (OAuth)'}
                                    </button>

                                    {/* Refresh token */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            OAuth Refresh Token
                                            <span className="ml-2 text-xs text-slate-400">(auto-filled after Connect, or paste manually)</span>
                                        </label>
                                        <textarea required={!hasStoredOauthRefreshToken} rows={4} value={formData.oauth_refresh_token} spellCheck={false}
                                            onChange={e => setFormData(p => ({ ...p, oauth_refresh_token: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-950 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                        {hasStoredOauthRefreshToken && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Leave blank to keep the stored refresh token, or reconnect to replace it.
                                            </p>
                                        )}
                                    </div>

                                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-xs text-blue-700 dark:text-blue-400">
                                        Personal Google Drive uses OAuth refresh tokens. Do not use Impersonate Email for @gmail.com accounts.
                                        After clicking Connect and granting access, the refresh token will be auto-filled above — then click Save.
                                    </div>
                                </>
                            )}

                            {/* --- Service Account fields --- */}
                            {formData.auth_type === 'service_account' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Account Credentials (JSON)</label>
                                        <textarea required={!hasStoredCredentialsJson} rows={10} value={formData.credentials_json} spellCheck={false}
                                            onChange={e => setFormData(p => ({ ...p, credentials_json: e.target.value }))}
                                            placeholder="Paste content of your Google Service Account JSON key file…"
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-950 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                        {hasStoredCredentialsJson && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Leave blank to keep the service account credentials already stored in the backend.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Impersonate Email <span className="text-slate-400 font-normal">(Workspace / DWD only)</span></label>
                                        <input type="email" value={formData.subject_email}
                                            onChange={e => setFormData(p => ({ ...p, subject_email: e.target.value }))}
                                            placeholder="admin@company.com"
                                            className={`w-full px-4 py-2.5 rounded-lg border ${formData.subject_email?.endsWith('@gmail.com') ? 'border-amber-400 focus:ring-amber-500 focus:border-amber-500' : 'border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500'} bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 placeholder-slate-400`} />
                                        {formData.subject_email?.endsWith('@gmail.com') && (
                                            <p className="text-xs text-amber-600 mt-1">⚠️ Personal @gmail.com accounts do not support impersonation.</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">Leave blank for standard Service Account access. Only required for Domain-Wide Delegation.</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                                        Service Account is for Google Workspace Shared Drives. For a normal @gmail.com personal drive, use Personal OAuth instead.
                                    </div>
                                </>
                            )}

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal}
                                    className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving || oauthConnecting}
                                    className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                                    {saving ? 'Saving…' : editingId ? 'Update Account' : 'Save Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false })}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
            />
        </div>
    );
};

export default BackupAccounts;
