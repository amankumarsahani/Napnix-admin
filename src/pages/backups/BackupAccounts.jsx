import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiCheckCircle, FiEdit2, FiFolder, FiKey, FiLink, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import serverService from '../../api/admin';
import toast from 'react-hot-toast';
import {
    Badge, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel,
    Skeleton, StatCard, Textarea, cx,
} from '../../components/ui';

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

const BackupAccounts = () => {
    const accountsQuery = useQuery({
        queryKey: ['backup-accounts'],
        queryFn: () => serverService.getAllBackupAccounts().then(r => r.data || []),
        staleTime: 60 * 1000,
    });
    const accounts = useMemo(() => accountsQuery.data || [], [accountsQuery.data]);
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

    const fetchAccounts = () => accountsQuery.refetch();

    useEffect(() => {
        if (!editingId || editingAccountMeta || accounts.length === 0) return;
        const account = accounts.find((item) => item.id === editingId);
        if (account) {
            setEditingAccountMeta(account);
        }
    }, [accounts, editingAccountMeta, editingId]);

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
            if (pending?.editingAccountMeta) setEditingAccountMeta(prev => prev || pending.editingAccountMeta);
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
                    ? `Google Drive connected (${email}). Save the account to keep the refresh token.`
                    : 'Google Drive connected. Save the account to keep the refresh token.');
            } catch (err) {
                toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to exchange Google OAuth code.');
            } finally {
                setOauthConnecting(false);
                sessionStorage.removeItem(GOOGLE_OAUTH_SESSION_KEY);
                clearOAuthParams();
            }
        };

        runExchange();
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
            title: 'Delete backup account?',
            message: 'Scheduled backups that use this account will stop. This can’t be undone.',
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
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    const handleRunBackup = () => {
        setConfirmState({
            isOpen: true,
            title: 'Run a backup now?',
            message: 'Backs up every tenant now. Tenant APIs may be slower while it runs.',
            variant: 'primary',
            confirmText: 'Start backup',
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
            editingAccountMeta,
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

    const closeConfirm = () => setConfirmState({ isOpen: false });
    const isPersonalForm = formData.auth_type === 'oauth_personal';
    const set = key => e => setFormData(p => ({ ...p, [key]: e.target.value }));

    let body;
    if (accountsQuery.isLoading) body = <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-md" />)}</div>;
    else if (accountsQuery.isError) body = <ErrorState error={accountsQuery.error} onRetry={fetchAccounts} />;
    else if (!accounts.length) {
        body = (
            <Panel>
                <EmptyState
                    title="No backup accounts"
                    description="Connect a Google Drive account (personal OAuth or service account) to turn on automated backups."
                    action={<Button variant="primary" onClick={openCreate}><FiPlus className="size-4" />Connect account</Button>}
                />
            </Panel>
        );
    } else {
        body = (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {accounts.map(account => {
                    const isPersonal = account.auth_type === 'oauth_personal';
                    // The API never returns secrets, only *_configured flags and a summary
                    const tokenOk = account.oauth_refresh_token_configured;
                    const row = (icon, children, className) => (
                        <p className={cx('flex items-center gap-2 text-sm text-fg-muted min-w-0', className)}>
                            <span aria-hidden="true" className="shrink-0 text-fg-subtle">{icon}</span>
                            <span className="truncate">{children}</span>
                        </p>
                    );
                    return (
                        <Panel key={account.id}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-fg truncate">{account.account_name}</h2>
                                    <p className="mt-1 flex flex-wrap gap-1">
                                        <Badge tone={account.is_active ? 'success' : 'neutral'}>{account.is_active ? 'Active' : 'Inactive'}</Badge>
                                        <Badge tone="info">{isPersonal ? 'Personal OAuth' : 'Service account'}</Badge>
                                    </p>
                                </div>
                                <span className="inline-flex gap-0.5 -mr-1">
                                    <IconButton size="sm" label={`Edit ${account.account_name}`} onClick={() => handleEdit(account)}><FiEdit2 className="size-4" /></IconButton>
                                    <IconButton size="sm" variant="danger" label={`Delete ${account.account_name}`} onClick={() => handleDelete(account.id)}><FiTrash2 className="size-4" /></IconButton>
                                </span>
                            </div>
                            <div className="mt-4 space-y-1.5">
                                {account.folder_id && row(<FiFolder className="size-3.5" />, <>Folder <span className="font-mono text-xs">{account.folder_id}</span></>)}
                                {isPersonal ? (
                                    <>
                                        {account.oauth_client_id && row(<FiKey className="size-3.5" />, <span className="font-mono text-xs">{account.oauth_client_id.slice(0, 24)}…</span>)}
                                        {row(
                                            tokenOk ? <FiCheckCircle className="size-3.5 text-success" /> : <FiAlertTriangle className="size-3.5 text-warning" />,
                                            tokenOk ? 'Refresh token stored' : 'Refresh token missing: reconnect Google Drive',
                                            tokenOk ? '' : 'text-warning'
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {account.credentials_summary && row(<FiKey className="size-3.5" />, account.credentials_summary)}
                                        {account.subject_email && row(<span>↳</span>, `Impersonating ${account.subject_email}`)}
                                    </>
                                )}
                                {row(<FiRefreshCw className="size-3.5" />, <>Used for <span className="font-mono tabular-nums text-fg">{account.usage_count ?? 0}</span> backups</>)}
                            </div>
                        </Panel>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <PageHeader
                title="Backups"
                description="Google Drive accounts for automated tenant backups"
                actions={
                    <>
                        <Button onClick={handleRunBackup}><FiRefreshCw className="size-4" />Run backup now</Button>
                        <Button variant="primary" onClick={openCreate}><FiPlus className="size-4" />Add Drive account</Button>
                    </>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Accounts" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard label="Personal OAuth" value={stats.personal} />
                <StatCard label="Service accounts" value={stats.service} />
            </div>

            {body}

            <Dialog
                open={isModalOpen}
                onClose={closeModal}
                dismissible={!oauthConnecting}
                title={editingId ? 'Edit backup account' : 'Connect Google Drive'}
                size="lg"
                footer={
                    <>
                        <Button onClick={closeModal} disabled={saving || oauthConnecting}>Cancel</Button>
                        <Button variant="primary" type="submit" form="backup-account-form" loading={saving} disabled={oauthConnecting}>
                            {editingId ? 'Save changes' : 'Save account'}
                        </Button>
                    </>
                }
            >
                {oauthConnecting && (
                    <p role="status" className="mb-4 flex items-center gap-2 rounded-sm border border-border bg-accent-soft px-3 py-2 text-sm text-fg">
                        <FiRefreshCw aria-hidden="true" className="size-4 animate-spin shrink-0" />
                        Exchanging the Google OAuth code…
                    </p>
                )}
                <form id="backup-account-form" onSubmit={handleSubmit} className="space-y-4">
                    <fieldset>
                        <legend className="mb-1.5 text-sm font-medium text-fg">Authentication</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                { value: 'oauth_personal', title: 'Personal Drive (OAuth)', desc: '@gmail.com Drive via OAuth client + refresh token' },
                                { value: 'service_account', title: 'Service account', desc: 'Workspace / Shared Drive via a JSON key' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    aria-pressed={formData.auth_type === opt.value}
                                    onClick={() => setFormData(prev => ({ ...prev, auth_type: opt.value }))}
                                    className={cx(
                                        'rounded-sm border p-3 text-left transition-colors',
                                        formData.auth_type === opt.value ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-2'
                                    )}
                                >
                                    <span className="block text-sm font-medium text-fg">{opt.title}</span>
                                    <span className="block mt-0.5 text-xs text-fg-muted">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Account label" required>
                            <Input required value={formData.account_name} onChange={set('account_name')} placeholder="e.g. Primary Drive" data-autofocus />
                        </Field>
                        <Field label="Drive folder ID" required>
                            <Input required value={formData.folder_id} onChange={set('folder_id')} className="font-mono" />
                        </Field>
                    </div>

                    {isPersonalForm ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="OAuth client ID" required>
                                    <Input required value={formData.oauth_client_id} onChange={set('oauth_client_id')} placeholder="…apps.googleusercontent.com" className="font-mono text-xs" />
                                </Field>
                                <Field label="OAuth client secret" required={!hasStoredOauthClientSecret} hint={hasStoredOauthClientSecret ? 'Leave blank to keep the stored secret' : undefined}>
                                    <Input type="password" autoComplete="off" required={!hasStoredOauthClientSecret} value={formData.oauth_client_secret} onChange={set('oauth_client_secret')} placeholder="GOCSPX-…" className="font-mono text-xs" />
                                </Field>
                            </div>
                            <div className="rounded-sm border border-border bg-surface-2 px-3 py-2 text-xs text-fg-muted">
                                <p className="font-medium text-fg">Authorized redirect URI (add it in Google Cloud Console)</p>
                                <p className="mt-0.5 font-mono break-all">{getRedirectUri()}</p>
                            </div>
                            <Button type="button" className="w-full" onClick={handleConnectGoogleDrive} disabled={oauthConnecting}>
                                <FiLink className="size-4" />{oauthConnecting ? 'Connecting…' : 'Connect Google Drive'}
                            </Button>
                            <Field
                                label="OAuth refresh token"
                                required={!hasStoredOauthRefreshToken}
                                hint={hasStoredOauthRefreshToken ? 'Leave blank to keep the stored token, or reconnect to replace it' : 'Filled in after Connect, or paste one'}
                            >
                                <Textarea rows={3} spellCheck={false} required={!hasStoredOauthRefreshToken} value={formData.oauth_refresh_token} onChange={set('oauth_refresh_token')} className="font-mono text-xs" />
                            </Field>
                            <p className="text-xs text-fg-muted">Personal Drive uses OAuth refresh tokens; impersonation doesn&apos;t apply to @gmail.com. After you grant access the token is filled in above. Then save.</p>
                        </>
                    ) : (
                        <>
                            <Field label="Service account key (JSON)" required={!hasStoredCredentialsJson} hint={hasStoredCredentialsJson ? 'Leave blank to keep the stored key' : 'Paste the JSON key file content'}>
                                <Textarea rows={8} spellCheck={false} required={!hasStoredCredentialsJson} value={formData.credentials_json} onChange={set('credentials_json')} className="font-mono text-xs" />
                            </Field>
                            <Field
                                label="Impersonate email"
                                hint="Only for Workspace domain-wide delegation; leave blank otherwise"
                                error={formData.subject_email?.endsWith('@gmail.com') ? 'Personal @gmail.com accounts can’t be impersonated' : undefined}
                            >
                                <Input type="email" value={formData.subject_email} onChange={set('subject_email')} placeholder="admin@company.com" />
                            </Field>
                            <p className="text-xs text-fg-muted">Service accounts are for Workspace Shared Drives. For a personal @gmail.com Drive, use Personal OAuth.</p>
                        </>
                    )}
                </form>
            </Dialog>

            <ConfirmDialog
                open={!!confirmState.isOpen}
                onClose={closeConfirm}
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
