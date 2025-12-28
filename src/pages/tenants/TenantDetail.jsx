import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenantsAPI } from '../../api';
import toast from 'react-hot-toast';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteOptions, setDeleteOptions] = useState({ dropDatabase: false });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const logsRef = useRef(null);
    const refreshInterval = useRef(null);

    useEffect(() => {
        fetchTenant();
    }, [id]);

    useEffect(() => {
        if (tenant) {
            fetchLogs();
        }
    }, [tenant?.id]);

    useEffect(() => {
        if (autoRefresh && tenant) {
            refreshInterval.current = setInterval(fetchLogs, 5000);
        } else {
            clearInterval(refreshInterval.current);
        }
        return () => clearInterval(refreshInterval.current);
    }, [autoRefresh, tenant?.id]);

    const fetchTenant = async () => {
        try {
            setLoading(true);
            const response = await tenantsAPI.getById(id);
            setTenant(response.data);
        } catch (error) {
            toast.error('Failed to fetch tenant');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!tenant) return;
        try {
            setLogsLoading(true);
            const response = await tenantsAPI.getLogs(tenant.id, 150);
            setLogs(response.data?.logs || 'No logs available');
            // Auto-scroll to bottom
            if (logsRef.current) {
                logsRef.current.scrollTop = logsRef.current.scrollHeight;
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs('Error fetching logs');
        } finally {
            setLogsLoading(false);
        }
    };

    const handleAction = async (action) => {
        setActionLoading(action);
        try {
            switch (action) {
                case 'start':
                    await tenantsAPI.start(tenant.id);
                    toast.success('Tenant started');
                    break;
                case 'stop':
                    await tenantsAPI.stop(tenant.id);
                    toast.success('Tenant stopped');
                    break;
                case 'restart':
                    await tenantsAPI.restart(tenant.id);
                    toast.success('Tenant restarted');
                    break;
                case 'provision':
                    await tenantsAPI.provision(tenant.id);
                    toast.success('Tenant provisioned');
                    break;
            }
            await fetchTenant();
            await fetchLogs();
        } catch (error) {
            toast.error(`Failed to ${action} tenant`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFullDelete = async () => {
        if (confirmText !== tenant.slug) {
            toast.error('Please type the tenant slug to confirm');
            return;
        }

        setDeleteLoading(true);
        try {
            await tenantsAPI.fullDelete(tenant.id, deleteOptions);
            toast.success('Tenant fully deleted');
            navigate('/tenants');
        } catch (error) {
            toast.error('Failed to delete tenant');
            console.error(error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'trial': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'suspended': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getProcessStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-emerald-500';
            case 'stopped': return 'bg-slate-400';
            case 'starting': return 'bg-amber-500 animate-pulse';
            case 'error': return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Tenant not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/tenants')}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tenant.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{tenant.slug}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getProcessStatusColor(tenant.process_status)}`}></div>
                        <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                            {tenant.process_status || 'stopped'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {tenant.process_status !== 'running' ? (
                        <button
                            onClick={() => handleAction('start')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {actionLoading === 'start' ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                            Start
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleAction('stop')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {actionLoading === 'stop' ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <rect x="6" y="6" width="12" height="12" />
                                    </svg>
                                )}
                                Stop
                            </button>
                            <button
                                onClick={() => handleAction('restart')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {actionLoading === 'restart' ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                Restart
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Port</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{tenant.assigned_port || '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Database</div>
                    <div className="text-sm font-mono text-slate-900 dark:text-white truncate">{tenant.db_name || '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Industry</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{tenant.industry_type || 'general'}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Plan</div>
                    <div className="text-lg font-semibold text-purple-600">{tenant.plan_name || 'Starter'}</div>
                </div>
            </div>

            {/* Domains Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Domains
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">API</div>
                        <a href={`https://${tenant.slug}-crm-api.nexspiresolutions.co.in`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline break-all">
                            {tenant.slug}-crm-api.nexspiresolutions.co.in
                        </a>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">CRM Dashboard</div>
                        <a href={`https://${tenant.slug}-crm.nexspiresolutions.co.in`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline break-all">
                            {tenant.slug}-crm.nexspiresolutions.co.in
                        </a>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Storefront</div>
                        <a href={`https://${tenant.slug}.nexspiresolutions.co.in`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline break-all">
                            {tenant.slug}.nexspiresolutions.co.in
                        </a>
                    </div>
                </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Admin Credentials
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-white">{tenant.email}</span>
                            <button
                                onClick={() => copyToClipboard(tenant.email)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                title="Copy"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-900 dark:text-white">{tenant.admin_password || '••••••••'}</span>
                            {tenant.admin_password && (
                                <button
                                    onClick={() => copyToClipboard(tenant.admin_password)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    title="Copy"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PM2 Logs Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PM2 Logs
                        {logsLoading && (
                            <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                    </h3>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                            />
                            Auto-refresh
                        </label>
                        <button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
                <div
                    ref={logsRef}
                    className="bg-slate-900 text-green-400 font-mono text-xs p-4 h-80 overflow-auto whitespace-pre-wrap"
                >
                    {logs || 'No logs available'}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800 p-6">
                <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Danger Zone
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">
                    Permanently delete this tenant. This will remove the PM2 process, Cloudflare DNS records, and optionally drop the database. This action cannot be undone.
                </p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Tenant Permanently
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-rose-600 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Confirm Permanent Deletion
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                                You are about to permanently delete <strong className="text-slate-900 dark:text-white">{tenant.name}</strong>. This will:
                            </p>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                                <li>Stop and remove the PM2 process</li>
                                <li>Remove Cloudflare DNS records (API, CRM, Storefront)</li>
                                <li>Remove from Cloudflare Pages custom domains</li>
                                <li>Remove from tunnel configuration</li>
                                <li>Remove from ecosystem.config.js</li>
                            </ul>

                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={deleteOptions.dropDatabase}
                                    onChange={(e) => setDeleteOptions(prev => ({ ...prev, dropDatabase: e.target.checked }))}
                                    className="rounded border-slate-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500"
                                />
                                <span>Also drop the database ({tenant.db_name})</span>
                            </label>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Type <strong>{tenant.slug}</strong> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    placeholder={tenant.slug}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfirmText('');
                                    setDeleteOptions({ dropDatabase: false });
                                }}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFullDelete}
                                disabled={deleteLoading || confirmText !== tenant.slug}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {deleteLoading && (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantDetail;
