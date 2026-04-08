import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiGlobe, FiDatabase, FiActivity, FiTerminal, FiTrash2,
    FiRefreshCw, FiExternalLink, FiServer, FiCreditCard, FiCheckCircle, FiXCircle, FiClock
} from '../../components/icons/FeatherIcons';
import { tenantsAPI, billingAPI } from '../../api';
import toast from 'react-hot-toast';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteOptions, setDeleteOptions] = useState({ dropDatabase: false });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [showDomainHelp, setShowDomainHelp] = useState(false);
    const [showDomainModal, setShowDomainModal] = useState(false);
    const [customDomains, setCustomDomains] = useState({ crm: '', storefront: '', api: '' });
    const [domainLoading, setDomainLoading] = useState(false);
    const logsRef = useRef(null);
    const refreshInterval = useRef(null);

    const domain = import.meta.env.VITE_APP_BASE_DOMAIN || 'nexspiresolutions.co.in';

    useEffect(() => {
        fetchTenant();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (tenant) {
            fetchLogs();
            fetchPayments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant?.id]);

    useEffect(() => {
        if (autoRefresh && tenant) {
            refreshInterval.current = setInterval(fetchLogs, 5000);
        } else {
            clearInterval(refreshInterval.current);
        }
        return () => clearInterval(refreshInterval.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const fetchPayments = async () => {
        if (!id) return;
        try {
            setPaymentsLoading(true);
            const response = await billingAPI.getTenantPayments(id);
            if (response.success) {
                setPayments(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setPaymentsLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!tenant) return;
        try {
            setLogsLoading(true);
            const response = await tenantsAPI.getLogs(tenant.id, 150);
            setLogs(response.data?.logs || 'No logs available');
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
        } catch (_error) {
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

    const handleSetupDomain = async () => {
        if (!customDomains.crm && !customDomains.storefront && !customDomains.api) {
            toast.error('Enter at least one domain');
            return;
        }
        setDomainLoading(true);
        try {
            await tenantsAPI.setupCustomDomain(tenant.id, customDomains);
            toast.success('Custom domains configured!');
            setShowDomainModal(false);
            fetchTenant();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to setup domains');
        } finally {
            setDomainLoading(false);
        }
    };

    const openDomainModal = () => {
        // Pre-fill with existing custom domains
        setCustomDomains({
            crm: tenant.custom_domain_crm || '',
            storefront: tenant.custom_domain_storefront || '',
            api: tenant.custom_domain_api || ''
        });
        setShowDomainModal(true);
    };

    const handleRestartProcess = async () => {
        setActionLoading('restart');
        try {
            await tenantsAPI.restartProcess(tenant.id);
            toast.success('Process restarting');
            setTimeout(fetchTenant, 2000);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to restart process');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndTrial = async () => {
        if (!window.confirm('Are you sure you want to end this trial and suspend the tenant? This will send them an email requesting payment.')) {
            return;
        }
        setActionLoading('endTrial');
        try {
            const res = await tenantsAPI.endTrial(tenant.id);
            toast.success(res.message || 'Trial ended successfully. Payment email sent.');
            fetchTenant();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to end trial');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendPaymentLink = async () => {
        if (!window.confirm('Send a payment link email to this tenant to subscribe?')) {
            return;
        }
        setActionLoading('sendPayment');
        try {
            const res = await tenantsAPI.sendPaymentLink(tenant.id);
            toast.success(res.message || 'Payment link sent successfully.');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send payment link');
        } finally {
            setActionLoading(null);
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
            case 'past_due': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPaymentStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'succeeded':
                return <FiCheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'failed':
                return <FiXCircle className="w-4 h-4 text-rose-500" />;
            default:
                return <FiClock className="w-4 h-4 text-amber-500" />;
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
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-xs">{tenant.slug}</p>
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
                            Start
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleAction('stop')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                Stop
                            </button>
                            <button
                                onClick={() => handleAction('restart')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                Restart
                            </button>
                        </>
                    )}

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    {tenant.status === 'trial' && (
                        <button
                            onClick={handleEndTrial}
                            disabled={actionLoading === 'endTrial'}
                            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {actionLoading === 'endTrial' ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <FiCreditCard className="w-4 h-4" />
                            )}
                            End Trial
                        </button>
                    )}

                    <button
                        onClick={handleSendPaymentLink}
                        disabled={actionLoading === 'sendPayment'}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                        title="Send payment link email without suspending tenant"
                    >
                        {actionLoading === 'sendPayment' ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <FiCreditCard className="w-4 h-4 text-indigo-500" />
                        )}
                        Send Payment Link
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Port</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{tenant.assigned_port || '-'}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <FiServer className="text-indigo-500" /> Server
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white truncate">{tenant.server_name || 'Primary'}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Industry</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{tenant.industry_type || 'general'}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Plan</div>
                    <div className="text-lg font-semibold text-purple-600">{tenant.plan_name || 'Starter'}</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiGlobe className="w-5 h-5 text-slate-500" />
                    Domains
                    <button onClick={openDomainModal} className="ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configure
                    </button>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {/* CRM Dashboard */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-indigo-200 dark:border-slate-600 dark:hover:border-indigo-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">CRM Dashboard</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.custom_domain_crm || `${tenant.slug}-crm.${domain}`}</p>
                                {tenant.custom_domain_crm ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tenant.custom_domain_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {tenant.custom_domain_verified ? 'Verified' : 'Pending DNS'}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400">Default</span>
                                )}
                            </div>
                        </div>
                        <a href={tenant.custom_domain_crm ? `https://${tenant.custom_domain_crm}` : `https://${tenant.slug}-crm.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                    {/* API */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-indigo-200 dark:border-slate-600 dark:hover:border-indigo-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">API</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.custom_domain_api || `${tenant.slug}-crm-api.${domain}`}</p>
                                {tenant.custom_domain_api ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tenant.custom_domain_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {tenant.custom_domain_verified ? 'Verified' : 'Pending DNS'}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400">Default</span>
                                )}
                            </div>
                        </div>
                        <a href={tenant.custom_domain_api ? `https://${tenant.custom_domain_api}` : `https://${tenant.slug}-crm-api.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                    {/* Storefront */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-indigo-200 dark:border-slate-600 dark:hover:border-indigo-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Storefront</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.custom_domain_storefront || `${tenant.slug}.${domain}`}</p>
                                {tenant.custom_domain_storefront ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tenant.custom_domain_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {tenant.custom_domain_verified ? 'Verified' : 'Pending DNS'}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400">Default</span>
                                )}
                            </div>
                        </div>
                        <a href={tenant.custom_domain_storefront ? `https://${tenant.custom_domain_storefront}` : `https://${tenant.slug}.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiDatabase className="w-5 h-5 text-slate-500" />
                    Infrastructure Details
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Database Name</p>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{tenant.db_name}</span>
                            <button onClick={() => copyToClipboard(tenant.db_name)} className="text-slate-400 hover:text-indigo-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Admin Email</p>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{tenant.email || 'admin@' + tenant.slug + '.local'}</span>
                            <button onClick={() => copyToClipboard(tenant.email || 'admin@' + tenant.slug + '.local')} className="text-slate-400 hover:text-indigo-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {tenant.admin_password && (
                        <div className="md:col-span-2">
                            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Admin Password</p>
                            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{tenant.admin_password}</span>
                                <button onClick={() => copyToClipboard(tenant.admin_password)} className="text-amber-600 hover:text-amber-700">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Use this password for initial admin login</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <FiCreditCard className="w-5 h-5 text-slate-500" />
                        Billing & Subscriptions
                        {paymentsLoading && (
                            <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Invoice</th>
                                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Plan</th>
                                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Amount</th>
                                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paymentsLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading billing history...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No payment history found for this tenant.</td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                                            {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs text-slate-500">{payment.invoice_number || '-'}</td>
                                        <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">{payment.plan_name || 'One-time Payment'}</td>
                                        <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                                            ₹{parseFloat(payment.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-1.5 capitalize text-slate-700 dark:text-slate-300">
                                                {getPaymentStatusIcon(payment.status)}
                                                <span className="text-xs">{payment.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FiTerminal className="w-5 h-5 text-slate-500" />
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
                                className="rounded border-slate-300 text-brand-600"
                            />
                            Auto-refresh
                        </label>
                        <button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <a
                            href={`https://${tenant.slug}-crm.nexspiresolutions.co.in`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <FiExternalLink className="w-4 h-4" />
                            Open CRM
                        </a>
                    </div>
                </div>
                <div ref={logsRef} className="bg-slate-900 text-green-400 font-mono text-xs p-4 h-80 overflow-auto whitespace-pre-wrap">
                    {logs || 'No logs available'}
                </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-900/30 p-6">
                <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <FiTrash2 className="w-5 h-5" />
                    Danger Zone
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">
                    Permanently delete this tenant and all associated data. This action is irreversible.
                </p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                    Delete Tenant
                </button>
            </div>

            {/* Custom Domain Modal */}
            {showDomainModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 my-8">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Configure Custom Domains</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Add CNAME records in your DNS provider pointing to the targets shown below.
                        </p>

                        {/* CRM Domain */}
                        <div className="mb-4 p-3 border rounded-lg">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CRM Dashboard</label>
                            <input
                                type="text"
                                value={customDomains.crm}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, crm: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="crm.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code>nexcrm-frontend.pages.dev</code></p>
                        </div>

                        {/* Storefront Domain */}
                        <div className="mb-4 p-3 border rounded-lg">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Storefront</label>
                            <input
                                type="text"
                                value={customDomains.storefront}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, storefront: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="yourbrand.com or store.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code>nexcrm-storefront.pages.dev</code></p>
                        </div>

                        {/* API Domain */}
                        <div className="mb-4 p-3 border rounded-lg">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Backend</label>
                            <input
                                type="text"
                                value={customDomains.api}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, api: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="api.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code>[tunnel-id].cfargotunnel.com</code></p>
                        </div>

                        {/* Setup Help Section */}
                        <div className="mb-4 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowDomainHelp(prev => !prev)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    How to set up a custom domain
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${showDomainHelp ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showDomainHelp && (
                                <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-800">
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Enter your custom domains above</p>
                                            <p className="text-xs mt-0.5">You can configure one, two, or all three. Each is optional.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Click "Save Domains"</p>
                                            <p className="text-xs mt-0.5">This registers the domains with Cloudflare Pages and Tunnel automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Add CNAME records in the tenant's DNS provider</p>
                                            <p className="text-xs mt-0.5">Go to the domain registrar (GoDaddy, Cloudflare, Namecheap, etc.) and add a CNAME record for each domain:</p>
                                            <div className="mt-2 bg-slate-50 dark:bg-slate-900 rounded-md p-2 text-xs font-mono space-y-1">
                                                <p><span className="text-slate-400">Storefront:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">store.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">nexcrm-storefront.pages.dev</span></p>
                                                <p><span className="text-slate-400">CRM:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">crm.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">nexcrm-frontend.pages.dev</span></p>
                                                <p><span className="text-slate-400">API:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">api.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">[tunnel-id].cfargotunnel.com</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">4</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Wait for DNS propagation</p>
                                            <p className="text-xs mt-0.5">DNS changes can take up to 24 hours but usually propagate within minutes. Cloudflare handles SSL certificates automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Done! Visit the custom domain</p>
                                            <p className="text-xs mt-0.5">The storefront will automatically detect the custom domain and load the correct tenant. Status will change from "Pending DNS" to "Verified" once the domain is resolving correctly.</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400">
                                        <strong>Note:</strong> If the tenant's domain is managed on Cloudflare, make sure the CNAME proxy status is set to <strong>Proxied</strong> (orange cloud) for SSL to work.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowDomainModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button
                                onClick={handleSetupDomain}
                                disabled={domainLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {domainLoading ? 'Configuring...' : 'Save Domains'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-semibold text-rose-600 mb-4">Confirm Permanent Deletion</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Type <strong>{tenant.slug}</strong> to confirm deletion of <strong>{tenant.name}</strong>.
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 mb-4"
                            placeholder={tenant.slug}
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-6">
                            <input
                                type="checkbox"
                                checked={deleteOptions.dropDatabase}
                                onChange={(e) => setDeleteOptions(prev => ({ ...prev, dropDatabase: e.target.checked }))}
                                className="rounded border-slate-300 text-rose-600"
                            />
                            Drop database ({tenant.db_name})
                        </label>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button
                                onClick={handleFullDelete}
                                disabled={deleteLoading || confirmText !== tenant.slug}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantDetail;
