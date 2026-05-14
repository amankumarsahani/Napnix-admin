import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiGlobe, FiDatabase, FiActivity, FiTerminal, FiTrash2,
    FiRefreshCw, FiExternalLink, FiServer, FiCreditCard, FiCheckCircle, FiXCircle, FiClock
} from '../../components/icons/FeatherIcons';
import { tenantsAPI, billingAPI, plansAPI, toolsAPI } from '../../api';
import toast from 'react-hot-toast';
import { createStatusColorFn } from '../../utils/statusColors';
import ConfirmModal from '../../components/common/ConfirmModal';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [plans, setPlans] = useState([]);
    const [tools, setTools] = useState([]);
    const [tenantTools, setTenantTools] = useState([]);
    const [toolPlans, setToolPlans] = useState({});
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
    const [sendingAgreement, setSendingAgreement] = useState(false);
    const [sendingBillingInvoice, setSendingBillingInvoice] = useState(false);
    const [savingBilling, setSavingBilling] = useState(false);
    const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(null);
    const [toolActionLoading, setToolActionLoading] = useState(null);
    const [billingForm, setBillingForm] = useState({
        plan_id: '',
        status: 'trial',
        trial_ends_at: '',
        billing_cycle: 'monthly',
        amount: '',
        follow_up_action: 'none'
    });
    const [toolForms, setToolForms] = useState({});
    const [billingRequestForm, setBillingRequestForm] = useState({
        billing_month: new Date().toISOString().slice(0, 7),
        due_date: ''
    });
    const [confirmState, setConfirmState] = useState({ isOpen: false });
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
            fetchSubscription();
            fetchTenantTools();
            setBillingForm(prev => ({
                ...prev,
                plan_id: tenant.plan_id ? String(tenant.plan_id) : '',
                status: tenant.status || 'trial',
                trial_ends_at: tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toISOString().split('T')[0] : '',
                amount: ''
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant?.id]);

    useEffect(() => {
        fetchPlans();
        fetchTools();
    }, []);

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
        } catch {
            toast.error('Failed to fetch tenant');
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
        } catch {
            // silently ignore
        } finally {
            setPaymentsLoading(false);
        }
    };

    const fetchSubscription = async () => {
        if (!id) return;
        try {
            const response = await billingAPI.getSubscription(id);
            if (response.success) {
                setSubscription(response.data);
                setBillingForm(prev => ({
                    ...prev,
                    billing_cycle: response.data?.billing_cycle || prev.billing_cycle || 'monthly'
                }));
            }
        } catch {
            setSubscription(null);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await plansAPI.getAll();
            if (response.success) {
                setPlans(response.data || []);
            }
        } catch {
            // silently ignore
        }
    };

    const fetchTools = async () => {
        try {
            const response = await toolsAPI.getAll();
            if (response.success) {
                const toolList = response.data || [];
                setTools(toolList);

                const planResults = await Promise.all(
                    toolList.map(async (tool) => {
                        const plansResponse = await toolsAPI.getPlans(tool.id);
                        return [tool.id, plansResponse.success ? (plansResponse.data || []) : []];
                    })
                );

                setToolPlans(Object.fromEntries(planResults));
            }
        } catch {
            // silently ignore
        }
    };

    const fetchTenantTools = async () => {
        if (!id) return;
        try {
            const response = await toolsAPI.getTenantTools(id);
            if (response.success) {
                const assignments = response.data || [];
                setTenantTools(assignments);
                setToolForms((prev) => {
                    const next = { ...prev };
                    assignments.forEach((assignment) => {
                        next[assignment.tool_id] = {
                            tool_plan_id: assignment.tool_plan_id ? String(assignment.tool_plan_id) : '',
                            trial_days: assignment.status === 'trial' && assignment.trial_ends_at
                                ? Math.max(1, Math.ceil((new Date(assignment.trial_ends_at).getTime() - Date.now()) / 86400000))
                                : ''
                        };
                    });
                    return next;
                });
            }
        } catch {
            setTenantTools([]);
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
        } catch {
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
        } catch {
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
        } catch {
            toast.error('Failed to delete tenant');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSetupDomain = async () => {
        if (!customDomains.crm && !customDomains.storefront) {
            toast.error('Enter at least one domain');
            return;
        }
        setDomainLoading(true);
        try {
            await tenantsAPI.setupCustomDomain(tenant.id, { crm: customDomains.crm, storefront: customDomains.storefront });
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
            api: ''
        });
        setShowDomainModal(true);
    };

    const handleEndTrial = () => {
        setConfirmState({
            isOpen: true,
            title: 'End Trial',
            message: 'Are you sure you want to end this trial and suspend the tenant? This will send them an email requesting payment.',
            variant: 'warning',
            confirmText: 'End Trial',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
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
            },
        });
    };

    const handleSendPaymentLink = () => {
        setConfirmState({
            isOpen: true,
            title: 'Send Payment Link',
            message: 'Send a payment link email to this tenant to subscribe?',
            variant: 'info',
            confirmText: 'Send Link',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                setActionLoading('sendPayment');
                try {
                    const res = await tenantsAPI.sendPaymentLink(tenant.id, {
                        billing_cycle: billingForm.billing_cycle || 'monthly'
                    });
                    toast.success(res.message || 'Payment link sent successfully.');
                } catch (error) {
                    toast.error(error.response?.data?.error || 'Failed to send payment link');
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const handleSendAgreement = async () => {
        setSendingAgreement(true);
        try {
            const res = await tenantsAPI.sendAgreement(tenant.id);
            toast.success(res.message || 'Agreement sent to tenant email');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send agreement');
        } finally {
            setSendingAgreement(false);
        }
    };

    const handleBillingFormChange = (field, value) => {
        setBillingForm(prev => ({ ...prev, [field]: value }));
    };

    const handleToolFormChange = (toolId, field, value) => {
        setToolForms((prev) => ({
            ...prev,
            [toolId]: {
                ...(prev[toolId] || {}),
                [field]: value
            }
        }));
    };

    const handleBillingRequestFormChange = (field, value) => {
        setBillingRequestForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveBilling = async () => {
        if (!tenant) return;

        setSavingBilling(true);
        try {
            await tenantsAPI.update(tenant.id, {
                plan_id: billingForm.plan_id ? Number(billingForm.plan_id) : null,
                status: billingForm.status,
                trial_ends_at: billingForm.trial_ends_at || null
            });

            if (billingForm.follow_up_action === 'send_payment_link') {
                const response = await tenantsAPI.sendPaymentLink(tenant.id, {
                    billing_cycle: billingForm.billing_cycle
                });
                toast.success(response.message || 'Billing updated and payment link sent.');
            } else if (billingForm.follow_up_action === 'mark_paid') {
                const response = await tenantsAPI.markPaid(tenant.id, {
                    billing_cycle: billingForm.billing_cycle,
                    amount: billingForm.amount ? Number(billingForm.amount) : undefined
                });
                toast.success(response.message || 'Billing updated and tenant marked as paid.');
            } else {
                toast.success('Billing settings updated.');
            }

            await fetchTenant();
            await fetchSubscription();
            await fetchPayments();
            setBillingForm(prev => ({ ...prev, amount: '', follow_up_action: 'none' }));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update billing settings');
        } finally {
            setSavingBilling(false);
        }
    };

    const handlePauseSubscription = async () => {
        if (!tenant) return;
        setSubscriptionActionLoading('pause');
        try {
            const response = await billingAPI.pauseSubscription(tenant.id);
            toast.success(response.message || 'Subscription paused.');
            await fetchTenant();
            await fetchSubscription();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to pause subscription');
        } finally {
            setSubscriptionActionLoading(null);
        }
    };

    const handleSendBillingInvoice = async () => {
        if (!tenant) return;

        setSendingBillingInvoice(true);
        try {
            const response = await tenantsAPI.sendBillingInvoice(tenant.id, {
                billing_cycle: billingForm.billing_cycle,
                billing_month: billingRequestForm.billing_month,
                due_date: billingRequestForm.due_date || undefined,
                amount: effectiveAmount ? Number(effectiveAmount) : undefined
            });
            toast.success(response.message || 'Invoice and payment link sent.');
            await fetchPayments();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send billing invoice');
        } finally {
            setSendingBillingInvoice(false);
        }
    };

    const handleResumeSubscription = async () => {
        if (!tenant) return;
        setSubscriptionActionLoading('resume');
        try {
            const response = await billingAPI.resumeSubscription(tenant.id);
            toast.success(response.message || 'Subscription resumed.');
            await fetchTenant();
            await fetchSubscription();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to resume subscription');
        } finally {
            setSubscriptionActionLoading(null);
        }
    };

    const handleCancelSubscription = (immediate) => {
        if (!tenant) return;
        setConfirmState({
            isOpen: true,
            title: immediate ? 'Cancel Subscription Now' : 'Cancel At Period End',
            message: immediate
                ? 'This will cancel the current subscription immediately and stop active tenant access.'
                : 'This will ask Razorpay to cancel the subscription at the end of the current billing period.',
            variant: 'warning',
            confirmText: immediate ? 'Cancel Now' : 'Schedule Cancel',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                setSubscriptionActionLoading(immediate ? 'cancel-now' : 'cancel-later');
                try {
                    const response = await billingAPI.cancelSubscription(tenant.id, { immediate });
                    toast.success(response.message || 'Subscription updated.');
                    await fetchTenant();
                    await fetchSubscription();
                } catch (error) {
                    toast.error(error.response?.data?.error || 'Failed to cancel subscription');
                } finally {
                    setSubscriptionActionLoading(null);
                }
            }
        });
    };

    const handleEnableTool = async (tool) => {
        if (!tenant) return;
        const formState = toolForms[tool.id] || {};
        setToolActionLoading(`enable-${tool.id}`);
        try {
            if (tool.slug === 'nexcrm') {
                const response = await toolsAPI.enableCRM(tenant.id, {
                    plan_id: billingForm.plan_id ? Number(billingForm.plan_id) : tenant.plan_id,
                    server_id: tenant.server_id || undefined
                });
                toast.success(response.message || 'CRM provisioning started.');
            } else {
                const response = await toolsAPI.enableTool(tenant.id, {
                    tool_id: tool.id,
                    tool_plan_id: formState.tool_plan_id ? Number(formState.tool_plan_id) : null,
                    trial_days: formState.trial_days ? Number(formState.trial_days) : null
                });
                toast.success(response.message || `${tool.name} enabled.`);
            }
            await fetchTenant();
            await fetchTenantTools();
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to enable ${tool.name}`);
        } finally {
            setToolActionLoading(null);
        }
    };

    const handleDisableTool = async (tool) => {
        if (!tenant) return;
        setToolActionLoading(`disable-${tool.id}`);
        try {
            const response = await toolsAPI.disableTool(tenant.id, { tool_id: tool.id });
            toast.success(response.message || `${tool.name} disabled.`);
            await fetchTenantTools();
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to disable ${tool.name}`);
        } finally {
            setToolActionLoading(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const getStatusColor = createStatusColorFn('tenant');

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

    const selectedPlan = plans.find((plan) => String(plan.id) === String(billingForm.plan_id));
    const suggestedAmount = selectedPlan
        ? Number(billingForm.billing_cycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)
        : 0;
    const effectiveAmount = billingForm.amount || (suggestedAmount ? String(suggestedAmount) : '');
    const tenantToolMap = tenantTools.reduce((acc, assignment) => {
        acc[assignment.tool_id] = assignment;
        return acc;
    }, {});
    const trialDaysRemaining = tenant?.trial_ends_at
        ? Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000)
        : null;
    const currentMonthValue = new Date().toISOString().slice(0, 7);
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousMonthValue = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

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
                            className="px-4 py-2 bg-brand-600 dark:bg-brand-500 text-white rounded-lg hover:bg-brand-700 dark:hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2"
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
                            <FiCreditCard className="w-4 h-4 text-brand-500" />
                        )}
                        Send Payment Link
                    </button>

                    <button
                        onClick={handleSendAgreement}
                        disabled={sendingAgreement}
                        className="px-4 py-2 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                        title="Send service agreement PDF to tenant email"
                    >
                        {sendingAgreement ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        )}
                        {sendingAgreement ? 'Sending...' : 'Send Agreement'}
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
                        <FiServer className="text-brand-500" /> Server
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
                    <button onClick={openDomainModal} className="ml-auto text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configure
                    </button>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {/* CRM Dashboard */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-brand-200 dark:border-slate-600 dark:hover:border-brand-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center text-brand-600">
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
                        <a href={tenant.custom_domain_crm ? `https://${tenant.custom_domain_crm}` : `https://${tenant.slug}-crm.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-brand-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                    {/* API (always uses default nexspiresolutions domain) */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-brand-200 dark:border-slate-600 dark:hover:border-brand-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">API</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.slug}-crm-api.{domain}</p>
                                <span className="text-[10px] text-slate-400">Managed by NexSpire</span>
                            </div>
                        </div>
                        <a href={`https://${tenant.slug}-crm-api.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-brand-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                    {/* Storefront */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-brand-200 dark:border-slate-600 dark:hover:border-brand-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center text-brand-600">
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
                        <a href={tenant.custom_domain_storefront ? `https://${tenant.custom_domain_storefront}` : `https://${tenant.slug}.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-brand-600 transition">
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
                            <button onClick={() => copyToClipboard(tenant.db_name)} className="text-slate-400 hover:text-brand-600">
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
                            <button onClick={() => copyToClipboard(tenant.email || 'admin@' + tenant.slug + '.local')} className="text-slate-400 hover:text-brand-600">
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
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-6">
                    <div className="grid md:grid-cols-5 gap-4">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Current Plan</div>
                            <div className="text-lg font-semibold text-slate-900 dark:text-white">{subscription?.plan_name || tenant.plan_name || 'Unassigned'}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Subscription</div>
                            <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{subscription?.status || 'Not created yet'}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Billing Cycle</div>
                            <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{subscription?.billing_cycle || billingForm.billing_cycle}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Current Period Ends</div>
                            <div className="text-lg font-semibold text-slate-900 dark:text-white">
                                {subscription?.current_period_end
                                    ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Not set'}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Trial Ends</div>
                            <div className="text-lg font-semibold text-slate-900 dark:text-white">
                                {tenant.trial_ends_at
                                    ? new Date(tenant.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'No trial'}
                            </div>
                            {tenant.status === 'trial' && trialDaysRemaining !== null && (
                                <div className={`mt-1 text-xs ${trialDaysRemaining >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {trialDaysRemaining >= 0 ? `${trialDaysRemaining} day(s) remaining` : 'Trial expired'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handlePauseSubscription}
                            disabled={!subscription || subscription.status !== 'active' || subscriptionActionLoading}
                            className="px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
                        >
                            {subscriptionActionLoading === 'pause' ? 'Pausing...' : 'Pause Subscription'}
                        </button>
                        <button
                            onClick={handleResumeSubscription}
                            disabled={!subscription || subscription.status !== 'paused' || subscriptionActionLoading}
                            className="px-4 py-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 transition-colors"
                        >
                            {subscriptionActionLoading === 'resume' ? 'Resuming...' : 'Resume Subscription'}
                        </button>
                        <button
                            onClick={() => handleCancelSubscription(false)}
                            disabled={!subscription || ['cancelled', 'expired'].includes(subscription.status) || subscriptionActionLoading}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                            {subscriptionActionLoading === 'cancel-later' ? 'Scheduling...' : 'Cancel At Period End'}
                        </button>
                        <button
                            onClick={() => handleCancelSubscription(true)}
                            disabled={!subscription || ['cancelled', 'expired'].includes(subscription.status) || subscriptionActionLoading}
                            className="px-4 py-2.5 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors"
                        >
                            {subscriptionActionLoading === 'cancel-now' ? 'Cancelling...' : 'Cancel Immediately'}
                        </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Edit Trial & Billing</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    New tenants already start automatically as a 14-day trial. Use this form to change the plan, edit the trial end date, activate access, send a payment link, or mark the tenant as paid.
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Plan</label>
                                <select
                                    value={billingForm.plan_id}
                                    onChange={(e) => handleBillingFormChange('plan_id', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="">Select Plan</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - ₹{plan.price_monthly}/mo
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Tenant Status</label>
                                <select
                                    value={billingForm.status}
                                    onChange={(e) => handleBillingFormChange('status', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="trial">Trial</option>
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Trial Ends On</label>
                                <input
                                    type="date"
                                    value={billingForm.trial_ends_at}
                                    onChange={(e) => handleBillingFormChange('trial_ends_at', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Billing Cycle</label>
                                <select
                                    value={billingForm.billing_cycle}
                                    onChange={(e) => handleBillingFormChange('billing_cycle', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Manual Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={billingForm.amount}
                                    onChange={(e) => handleBillingFormChange('amount', e.target.value)}
                                    placeholder={suggestedAmount ? `${suggestedAmount}` : 'Auto from plan'}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {selectedPlan
                                        ? `Suggested ${billingForm.billing_cycle} amount: ₹${suggestedAmount.toFixed(2)}`
                                        : 'Pick a plan to auto-suggest the amount.'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">After Save</label>
                                <select
                                    value={billingForm.follow_up_action}
                                    onChange={(e) => handleBillingFormChange('follow_up_action', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="none">Do nothing</option>
                                    <option value="send_payment_link">Send payment link</option>
                                    <option value="mark_paid">Mark paid & activate</option>
                                </select>
                            </div>
                        </div>

                        {billingForm.follow_up_action === 'mark_paid' && (
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                                Saving will record a successful manual payment of ₹{Number(effectiveAmount || 0).toFixed(2)} and activate the tenant.
                            </div>
                        )}

                        {billingForm.follow_up_action === 'send_payment_link' && (
                            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-4 py-3 text-sm text-brand-700 dark:text-brand-300">
                                Saving will keep the edited plan/trial values and email a payment link to the tenant.
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveBilling}
                                disabled={savingBilling}
                                className="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {savingBilling ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <FiCheckCircle className="w-4 h-4" />
                                )}
                                Save Billing Changes
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Send Billing Invoice</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Send a PDF invoice plus Razorpay payment link for a specific billing month. Use this for previous month dues or the current cycle.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleBillingRequestFormChange('billing_month', previousMonthValue)}
                                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                            >
                                Previous Month
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBillingRequestFormChange('billing_month', currentMonthValue)}
                                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                            >
                                Current Month
                            </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Billing Month</label>
                                <input
                                    type="month"
                                    value={billingRequestForm.billing_month}
                                    onChange={(e) => handleBillingRequestFormChange('billing_month', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Due Date</label>
                                <input
                                    type="date"
                                    value={billingRequestForm.due_date}
                                    onChange={(e) => handleBillingRequestFormChange('due_date', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="flex items-end">
                                <div className="w-full rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Invoice Amount</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                        ₹{Number(effectiveAmount || 0).toFixed(2)}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Uses the manual amount above when entered, otherwise the selected plan amount.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSendBillingInvoice}
                                disabled={sendingBillingInvoice || !billingRequestForm.billing_month}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {sendingBillingInvoice ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <FiCreditCard className="w-4 h-4" />
                                )}
                                Send Invoice + Payment Link
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Tenant Tools</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Enable or suspend add-on products per tenant. CRM provisioning is special-cased and uses the tenant infrastructure already assigned.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {tools.map((tool) => {
                                const assignment = tenantToolMap[tool.id];
                                const formState = toolForms[tool.id] || {};
                                const plansForTool = toolPlans[tool.id] || [];
                                const isEnabled = Boolean(assignment) && !['suspended', 'cancelled'].includes(assignment.status);
                                const loadingKey = isEnabled ? `disable-${tool.id}` : `enable-${tool.id}`;

                                return (
                                    <div key={tool.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-semibold text-slate-900 dark:text-white">{tool.name}</h5>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                        {assignment?.status || 'not enabled'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tool.description}</p>
                                                {assignment?.plan_name && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                        Current plan: <span className="font-medium text-slate-700 dark:text-slate-200">{assignment.plan_name}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {tool.slug !== 'nexcrm' && isEnabled && (
                                                    <button
                                                        onClick={() => handleDisableTool(tool)}
                                                        disabled={toolActionLoading === loadingKey}
                                                        className="px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors"
                                                    >
                                                        {toolActionLoading === loadingKey ? 'Disabling...' : 'Disable'}
                                                    </button>
                                                )}
                                                {!isEnabled && (
                                                    <button
                                                        onClick={() => handleEnableTool(tool)}
                                                        disabled={toolActionLoading === loadingKey}
                                                        className="px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {toolActionLoading === loadingKey ? 'Enabling...' : tool.slug === 'nexcrm' ? 'Provision CRM' : 'Enable'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Tool Plan</label>
                                                <select
                                                    value={formState.tool_plan_id || ''}
                                                    onChange={(e) => handleToolFormChange(tool.id, 'tool_plan_id', e.target.value)}
                                                    disabled={tool.slug === 'nexcrm' || plansForTool.length === 0}
                                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                                                >
                                                    <option value="">No plan</option>
                                                    {plansForTool.map((plan) => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {plan.name} - ₹{plan.price_monthly}/mo
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Trial Days</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formState.trial_days || ''}
                                                    onChange={(e) => handleToolFormChange(tool.id, 'trial_days', e.target.value)}
                                                    disabled={tool.slug === 'nexcrm'}
                                                    placeholder="Leave empty for active"
                                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {tool.slug === 'nexcrm'
                                                        ? 'CRM uses tenant process/server provisioning and is managed separately from add-on tools.'
                                                        : assignment?.trial_ends_at
                                                            ? `Trial ends ${new Date(assignment.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                            : 'Enable with a trial or direct active status.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
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
                            href={`https://${tenant.slug}-crm.${domain}`}
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 my-8">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Configure Custom Domains</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Point the tenant's custom domains to Cloudflare Pages. The API always stays on <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">{tenant.slug}-crm-api.{domain}</code>.
                        </p>

                        {/* CRM Domain */}
                        <div className="mb-4 p-3 border rounded-lg dark:border-slate-600">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CRM Dashboard</label>
                            <input
                                type="text"
                                value={customDomains.crm}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, crm: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="crm.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">nexcrm-frontend.pages.dev</code></p>
                        </div>

                        {/* Storefront Domain */}
                        <div className="mb-4 p-3 border rounded-lg dark:border-slate-600">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Storefront</label>
                            <input
                                type="text"
                                value={customDomains.storefront}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, storefront: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="yourbrand.com or store.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">nexcrm-storefront.pages.dev</code></p>
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
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">1</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Enter the tenant's custom domains above</p>
                                            <p className="text-xs mt-0.5">CRM and Storefront are both optional. You can set up one or both.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">2</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Click "Save Domains"</p>
                                            <p className="text-xs mt-0.5">This registers the custom domains with Cloudflare Pages automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">3</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Tenant adds CNAME records in their DNS provider</p>
                                            <p className="text-xs mt-0.5">The tenant goes to their domain registrar (GoDaddy, Namecheap, etc.) and adds CNAME records:</p>
                                            <div className="mt-2 bg-slate-50 dark:bg-slate-900 rounded-md p-2 text-xs font-mono space-y-1">
                                                <p><span className="text-slate-400">CRM:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">crm.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">nexcrm-frontend.pages.dev</span></p>
                                                <p><span className="text-slate-400">Storefront:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">store.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">nexcrm-storefront.pages.dev</span></p>
                                            </div>
                                            <p className="text-xs mt-1.5 text-slate-500">Works with any DNS provider — no Cloudflare account needed for the tenant.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">4</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Wait for DNS propagation</p>
                                            <p className="text-xs mt-0.5">Usually takes a few minutes. Cloudflare Pages handles SSL certificates automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Done!</p>
                                            <p className="text-xs mt-0.5">The storefront will automatically detect the custom domain and load the correct tenant. The API stays on <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{domain}</code> under the hood — customers never see it.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowDomainModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button
                                onClick={handleSetupDomain}
                                disabled={domainLoading}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {domainLoading ? 'Configuring...' : 'Save Domains'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

export default TenantDetail;
