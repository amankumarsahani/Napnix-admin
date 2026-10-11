import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiChevronDown, FiCreditCard, FiFileText } from 'react-icons/fi';
import { tenantsAPI } from '../../api';
import {
    Button, ConfirmDialog, ErrorState, Menu, PageHeader, Skeleton, StatusBadge, Tabs, cx,
} from '../../components/ui';
import OverviewTab from './detail/OverviewTab';
import BillingTab from './detail/BillingTab';
import ToolsTab from './detail/ToolsTab';
import LogsTab from './detail/LogsTab';
import { DeleteDialog, DomainDialog } from './detail/TenantDialogs';
import { PROCESS_DOT, apiError } from './detail/helpers';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'billing', label: 'Billing' },
    { id: 'tools', label: 'Tools' },
    { id: 'logs', label: 'Logs' },
];
const DONE = { start: 'Tenant started', stop: 'Tenant stopped', restart: 'Tenant restarted', provision: 'Tenant provisioned', unsuspend: 'Tenant unsuspended' };

export default function TenantDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'overview';
    const [confirm, setConfirm] = useState(null); // { title, message, confirmText, variant, run }
    const [domainsOpen, setDomainsOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const query = useQuery({
        queryKey: ['tenant', id],
        queryFn: () => tenantsAPI.getById(id).then(r => r.data),
        // follow provisioning until it settles
        refetchInterval: q => (q.state.data?.process_status === 'starting' ? 4000 : false),
    });
    const tenant = query.data;

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['tenant', id] });
        qc.invalidateQueries({ queryKey: ['tenants'] });
        qc.invalidateQueries({ queryKey: ['tenant-logs', id] });
    };
    const fail = (fallback) => err => toast.error(err.response?.data?.provisionError || apiError(err, fallback));

    const process = useMutation({
        mutationFn: action => tenantsAPI[action](id),
        onSuccess: (_, action) => { toast.success(DONE[action]); refresh(); },
        onError: (err, action) => fail(`Failed to ${action} tenant`)(err),
    });
    const endTrial = useMutation({
        mutationFn: () => tenantsAPI.endTrial(id),
        onSuccess: r => { toast.success(r.message || 'Trial ended. Payment email sent.'); refresh(); },
        onError: fail('Failed to end trial'),
    });
    const paymentLink = useMutation({
        mutationFn: () => tenantsAPI.sendPaymentLink(id, { billing_cycle: 'monthly' }),
        onSuccess: r => toast.success(r.message || 'Payment link sent.'),
        onError: fail('Failed to send payment link'),
    });
    const agreement = useMutation({
        mutationFn: () => tenantsAPI.sendAgreement(id),
        onSuccess: r => toast.success(r.message || 'Agreement sent to the tenant email'),
        onError: fail('Failed to send agreement'),
    });
    const domains = useMutation({
        mutationFn: d => tenantsAPI.setupCustomDomain(id, d),
        onSuccess: () => { toast.success('Custom domains configured'); setDomainsOpen(false); refresh(); },
        onError: fail('Failed to set up domains'),
    });
    const migration = useMutation({
        mutationFn: () => tenantsAPI.runMigration(id),
        onSuccess: () => toast.success('Migration complete: all tables are up to date'),
        onError: fail('Migration failed'),
    });
    const repair = useMutation({
        mutationFn: () => tenantsAPI.repairDns(id),
        onSuccess: r => (r.success ? (toast.success('DNS repaired: domains are active'), refresh()) : toast.error('Repair attempted, but the Pages domain may still be starting. Try again in 30s.')),
        onError: fail('DNS repair failed'),
    });
    const del = useMutation({
        mutationFn: opts => tenantsAPI.fullDelete(id, opts),
        onSuccess: () => { toast.success('Tenant deleted'); qc.invalidateQueries({ queryKey: ['tenants'] }); navigate('/tenants'); },
        onError: fail('Failed to delete tenant'),
    });

    if (query.isLoading) return <div className="max-w-6xl space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 rounded-md" /><Skeleton className="h-64 rounded-md" /></div>;
    if (query.isError || !tenant) return <ErrorState error={query.error || { message: 'Tenant not found' }} onRetry={query.refetch} />;

    const busy = process.isPending;
    const failed = tenant.process_status === 'error' || tenant.provision_error;
    const askProcess = action => setConfirm({
        title: action === 'stop' ? 'Stop tenant?' : 'Restart tenant?',
        message: action === 'stop'
            ? `${tenant.name}'s CRM goes offline for its users until you start it again.`
            : `${tenant.name}'s CRM is unavailable for a few seconds while it restarts.`,
        confirmText: action === 'stop' ? 'Stop tenant' : 'Restart',
        variant: action === 'stop' ? 'danger' : 'primary',
        run: () => process.mutate(action),
    });

    let processControls;
    if (tenant.process_status === 'running') {
        processControls = (
            <>
                <Button onClick={() => askProcess('restart')} disabled={busy}>Restart</Button>
                <Button variant="danger" onClick={() => askProcess('stop')} disabled={busy}>Stop</Button>
            </>
        );
    } else if (tenant.process_status === 'starting') {
        processControls = <Button disabled loading>Provisioning{tenant.provision_step ? `: ${tenant.provision_step.replace(/_/g, ' ')}` : ''}</Button>;
    } else if (failed || !tenant.assigned_port || !tenant.db_name) {
        processControls = <Button variant="primary" onClick={() => process.mutate('provision')} loading={busy}>Retry provisioning</Button>;
    } else {
        processControls = <Button variant="primary" onClick={() => process.mutate('start')} loading={busy}>Start</Button>;
    }

    const moreItems = [
        { label: 'Send payment link', icon: <FiCreditCard className="size-4" />, onSelect: () => setConfirm({ title: 'Send payment link?', message: 'Emails this tenant a link to subscribe.', confirmText: 'Send link', variant: 'primary', run: () => paymentLink.mutate() }) },
        { label: 'Send agreement', icon: <FiFileText className="size-4" />, onSelect: () => agreement.mutate() },
        ...(tenant.status === 'trial' ? [{
            label: 'End trial and request payment', icon: <FiCreditCard className="size-4" />, danger: true, separatorBefore: true,
            onSelect: () => setConfirm({ title: 'End this trial?', message: 'The tenant is suspended and emailed a payment request.', confirmText: 'End trial', variant: 'danger', run: () => endTrial.mutate() }),
        }] : []),
    ];

    return (
        <div className="max-w-6xl space-y-4">
            <PageHeader
                back={{ to: '/tenants', label: 'Tenants' }}
                title={tenant.name}
                description={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-xs">{tenant.slug}</span>
                        <StatusBadge entity="tenant" status={tenant.status} />
                        <span className="inline-flex items-center gap-1.5 text-sm capitalize">
                            <span aria-hidden="true" className={cx('size-2 rounded-full', PROCESS_DOT[tenant.process_status] || 'bg-fg-subtle')} />
                            {tenant.process_status || 'stopped'}
                        </span>
                    </span>
                }
                actions={
                    <>
                        {processControls}
                        <Menu label="More actions" items={moreItems}
                            trigger={<>More<FiChevronDown aria-hidden="true" className="size-4" /></>}
                            buttonClassName="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-3.5 text-sm text-fg hover:bg-surface-2" />
                    </>
                }
            />

            {failed && (
                <div role="alert" className="rounded-sm border border-danger/30 bg-danger-soft px-4 py-3">
                    <p className="font-medium text-danger">Provisioning failed</p>
                    <p className="mt-0.5 text-sm text-danger">
                        {tenant.provision_step && <span className="font-medium">Step: {tenant.provision_step.replace(/_/g, ' ')}. </span>}
                        {tenant.provision_error || 'The tenant infrastructure is incomplete. Retry provisioning to continue from the existing database and port.'}
                    </p>
                </div>
            )}

            <Tabs label="Tenant sections" tabs={TABS} value={tab} onChange={t => setParams({ tab: t }, { replace: true })} />

            {tab === 'overview' && (
                <OverviewTab
                    tenant={tenant}
                    onConfigureDomains={() => setDomainsOpen(true)}
                    onRepairDns={() => setConfirm({ title: 'Repair DNS?', message: 'Re-attaches the Pages custom domains and waits for them to go active. This can take up to 60 seconds.', confirmText: 'Repair DNS', variant: 'primary', run: () => repair.mutate() })}
                    repairing={repair.isPending}
                    onRunMigration={() => setConfirm({ title: 'Run migrations?', message: `Creates any missing tables on ${tenant.slug} for the ${tenant.industry_type || 'core'} industry.`, confirmText: 'Run migration', variant: 'primary', run: () => migration.mutate() })}
                    migrating={migration.isPending}
                    onDelete={() => setDeleteOpen(true)}
                />
            )}
            {tab === 'billing' && <BillingTab tenant={tenant} />}
            {tab === 'tools' && <ToolsTab tenant={tenant} />}
            {tab === 'logs' && <LogsTab tenant={tenant} />}

            <DomainDialog tenant={tenant} open={domainsOpen} onClose={() => setDomainsOpen(false)} onSubmit={d => domains.mutate(d)} saving={domains.isPending} />
            <DeleteDialog tenant={tenant} open={deleteOpen} onClose={() => setDeleteOpen(false)} onSubmit={opts => del.mutate(opts)} deleting={del.isPending} />
            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => { const run = confirm.run; setConfirm(null); run(); }}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                variant={confirm?.variant}
            />
        </div>
    );
}
