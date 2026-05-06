import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsAPI, billingAPI } from '../../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import TenantHeader from './TenantHeader';
import TenantStats from './TenantStats';
import TenantDomains from './TenantDomains';
import TenantInfrastructure from './TenantInfrastructure';
import TenantBilling from './TenantBilling';
import TenantLogs from './TenantLogs';
import TenantDangerZone from './TenantDangerZone';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [logs, setLogs] = useState('');
    const [logsLoading, setLogsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [showDomainModal, setShowDomainModal] = useState(false);
    const [customDomains, setCustomDomains] = useState({ crm: '', storefront: '', api: '' });
    const [domainLoading, setDomainLoading] = useState(false);
    const [sendingAgreement, setSendingAgreement] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const logsRef = useRef(null);
    const refreshInterval = useRef(null);

    const domain = import.meta.env.VITE_APP_BASE_DOMAIN || 'nexspiresolutions.co.in';

    const { data: tenantRes, isLoading: loading } = useQuery({
        queryKey: ['tenant', id],
        queryFn: () => tenantsAPI.getById(id),
        enabled: !!id,
    });

    const tenant = tenantRes?.data || null;

    const { data: paymentsRes, isLoading: paymentsLoading } = useQuery({
        queryKey: ['tenant', id, 'payments'],
        queryFn: () => billingAPI.getTenantPayments(id),
        enabled: !!tenant,
    });

    const payments = paymentsRes?.success ? paymentsRes.data : [];

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
            queryClient.invalidateQueries({ queryKey: ['tenant', id] });
            await fetchLogs();
        } catch (_error) {
            toast.error(`Failed to ${action} tenant`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFullDelete = async (confirmText, deleteOptions) => {
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
            queryClient.invalidateQueries({ queryKey: ['tenant', id] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to setup domains');
        } finally {
            setDomainLoading(false);
        }
    };

    const openDomainModal = () => {
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
                    queryClient.invalidateQueries({ queryKey: ['tenant', id] });
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
                    const res = await tenantsAPI.sendPaymentLink(tenant.id);
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
            <TenantHeader
                tenant={tenant}
                actionLoading={actionLoading}
                sendingAgreement={sendingAgreement}
                onNavigateBack={() => navigate('/tenants')}
                onAction={handleAction}
                onEndTrial={handleEndTrial}
                onSendPaymentLink={handleSendPaymentLink}
                onSendAgreement={handleSendAgreement}
                getStatusColor={getStatusColor}
                getProcessStatusColor={getProcessStatusColor}
            />

            <TenantStats tenant={tenant} />

            <TenantDomains
                tenant={tenant}
                domain={domain}
                customDomains={customDomains}
                setCustomDomains={setCustomDomains}
                domainLoading={domainLoading}
                showDomainModal={showDomainModal}
                setShowDomainModal={setShowDomainModal}
                onSetupDomain={handleSetupDomain}
                onOpenDomainModal={openDomainModal}
            />

            <TenantInfrastructure tenant={tenant} copyToClipboard={copyToClipboard} />

            <TenantBilling payments={payments} paymentsLoading={paymentsLoading} />

            <TenantLogs
                tenant={tenant}
                domain={domain}
                logs={logs}
                logsLoading={logsLoading}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                logsRef={logsRef}
                onFetchLogs={fetchLogs}
            />

            <TenantDangerZone
                tenant={tenant}
                onDelete={handleFullDelete}
                deleteLoading={deleteLoading}
            />

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
