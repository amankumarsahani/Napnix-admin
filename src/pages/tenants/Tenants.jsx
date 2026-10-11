import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiChevronRight, FiLoader, FiPlay, FiPlus, FiRefreshCw, FiSquare } from 'react-icons/fi';
import { tenantsAPI } from '../../api';
import { getProcessStatusColor } from '../../utils/statusColors';
import Pagination from '../../components/common/Pagination';
import {
    Badge, Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, SearchInput, StatCard, StatusBadge, cx,
} from '../../components/ui';
import CreateTenantDialog from './CreateTenantDialog';

const PAGE_SIZE = 10;
const needsProvision = t => t.process_status === 'error' || t.provision_error || !t.assigned_port || !t.db_name;

// What each action does, for the confirmation dialog. Anything that interrupts a live CRM is confirmed.
const ACTIONS = {
    start: { title: 'Start tenant?', message: t => `Start ${t.name}'s CRM process.`, confirmText: 'Start', variant: 'primary', done: 'Tenant started' },
    provision: { title: 'Retry provisioning?', message: t => `Re-run provisioning for ${t.name}. Steps that already succeeded are skipped.`, confirmText: 'Retry provisioning', variant: 'primary', done: 'Provisioning started' },
    stop: { title: 'Stop tenant?', message: t => `${t.name}'s CRM will be offline for its users until you start it again.`, confirmText: 'Stop tenant', variant: 'danger', done: 'Tenant stopped' },
    restart: { title: 'Restart tenant?', message: t => `${t.name}'s CRM will be unavailable for a few seconds while it restarts.`, confirmText: 'Restart', variant: 'primary', done: 'Tenant restarted' },
    unsuspend: { title: 'Unsuspend tenant?', message: () => 'Reactivate this tenant and restart its process? Its plan and data are unchanged.', confirmText: 'Unsuspend', variant: 'primary', done: 'Tenant unsuspended' },
    activate: { title: 'Activate tenant?', message: () => 'Are you sure you want to activate this tenant? This will end the trial period.', confirmText: 'Activate', variant: 'primary', done: 'Tenant activated' },
};

const runAction = (tenant, action) => (action === 'activate'
    ? tenantsAPI.update(tenant.id, { status: 'active' })
    : tenantsAPI[action](tenant.id));

export default function Tenants() {
    const domain = import.meta.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [pending, setPending] = useState(null); // { tenant, action } awaiting confirmation

    const params = { page, limit: PAGE_SIZE, ...(search && { search }) };
    const listQuery = useQuery({
        queryKey: ['tenants', params],
        queryFn: () => tenantsAPI.getAll(params),
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
        // Poll while any tenant is provisioning so the row updates without a reload
        refetchInterval: q => (q.state.data?.data || []).some(t => t.process_status === 'starting') ? 5000 : false,
    });
    const statsQuery = useQuery({
        queryKey: ['tenants', 'stats'],
        queryFn: () => tenantsAPI.getStats(),
        staleTime: 30 * 1000,
    });
    const tenants = listQuery.data?.data || [];
    const pagination = listQuery.data?.pagination;
    const stats = statsQuery.data?.data;

    const act = useMutation({
        mutationFn: ({ tenant, action }) => runAction(tenant, action),
        onSuccess: (_, { action }) => {
            toast.success(ACTIONS[action].done);
            setPending(null);
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
        },
        onError: (err, { action }) => {
            toast.error(err.response?.data?.error || `Failed to ${action} tenant`);
            setPending(null);
        },
    });

    const ask = (tenant, action) => setPending({ tenant, action });

    const rowActions = (t) => {
        const busy = act.isPending && act.variables?.tenant.id === t.id;
        return (
            <span className="inline-flex gap-0.5">
                {t.status === 'trial' && <IconButton size="sm" label={`Activate ${t.name} (end trial)`} onClick={() => ask(t, 'activate')}><FiCheckCircle className="size-4" /></IconButton>}
                {t.status === 'suspended' && <IconButton size="sm" label={`Unsuspend ${t.name}`} disabled={busy} onClick={() => ask(t, 'unsuspend')}><FiCheckCircle className="size-4" /></IconButton>}
                {t.process_status === 'running' ? (
                    <>
                        <IconButton size="sm" variant="danger" label={`Stop ${t.name}`} disabled={busy} onClick={() => ask(t, 'stop')}><FiSquare className="size-4" /></IconButton>
                        <IconButton size="sm" label={`Restart ${t.name}`} disabled={busy} onClick={() => ask(t, 'restart')}><FiRefreshCw className="size-4" /></IconButton>
                    </>
                ) : t.process_status === 'starting' ? (
                    <IconButton size="sm" label={`Provisioning${t.provision_step ? `: ${t.provision_step}` : ''}`} disabled><FiLoader className="size-4 animate-spin" /></IconButton>
                ) : (
                    <IconButton
                        size="sm"
                        label={needsProvision(t) ? `Retry provisioning ${t.name}` : `Start ${t.name}`}
                        disabled={busy}
                        className={cx(needsProvision(t) && 'text-danger')}
                        onClick={() => ask(t, needsProvision(t) ? 'provision' : 'start')}
                    >
                        {needsProvision(t) ? <FiRefreshCw className="size-4" /> : <FiPlay className="size-4" />}
                    </IconButton>
                )}
                <IconButton size="sm" label={`Open ${t.name}`} onClick={() => navigate(`/tenants/${t.id}`)}><FiChevronRight className="size-4" /></IconButton>
            </span>
        );
    };

    const action = pending && ACTIONS[pending.action];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Tenants"
                description="Manage NapCRM customers."
                actions={<Button variant="primary" onClick={() => setCreating(true)}><FiPlus className="size-4" />Add Tenant</Button>}
            />

            <SearchInput value={search} onChange={term => { setSearch(term); setPage(1); }} placeholder="Search tenants" label="Search tenants" className="w-full sm:w-72" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total tenants" value={stats?.total_tenants ?? '—'} />
                <StatCard label="Active" value={stats?.active ?? '—'} />
                <StatCard label="On trial" value={stats?.trial ?? '—'} />
                <StatCard label="Running" value={stats?.running_processes ?? '—'} />
            </div>

            <Panel flush>
                <DataTable
                    caption="Tenants"
                    loading={listQuery.isLoading}
                    error={listQuery.error}
                    onRetry={listQuery.refetch}
                    rows={tenants}
                    onRowClick={t => navigate(`/tenants/${t.id}`)}
                    className={cx(listQuery.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search ? `No tenants match “${search}”` : 'No tenants yet'} description={search ? undefined : 'Create your first tenant to provision a CRM.'} />}
                    columns={[
                        {
                            key: 'name', header: 'Tenant',
                            render: t => (
                                <span className="block min-w-0">
                                    <span className="block font-medium truncate">{t.name}</span>
                                    <span className="block font-mono text-xs text-fg-subtle truncate">{t.slug}-crm-api.{domain}</span>
                                </span>
                            ),
                        },
                        { key: 'industry', header: 'Industry', render: t => <Badge>{(t.industry_type || 'general').replace(/_/g, ' ')}</Badge> },
                        { key: 'plan', header: 'Plan', render: t => <Badge tone="info">{t.plan_name || 'Starter'}</Badge> },
                        { key: 'status', header: 'Status', render: t => <StatusBadge entity="tenant" status={t.status} /> },
                        {
                            key: 'process', header: 'Process',
                            render: t => (
                                <span className="inline-flex items-center gap-2 text-sm" title={t.provision_error || t.provision_step || undefined}>
                                    <span aria-hidden="true" className={cx('size-2 rounded-full', getProcessStatusColor(t.process_status))} />
                                    {(t.process_status || 'stopped').replace(/_/g, ' ')}
                                </span>
                            ),
                        },
                        { key: 'port', header: 'Port', mono: true, align: 'right', render: t => t.assigned_port || <span className="text-fg-subtle">—</span> },
                    ]}
                    actions={rowActions}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <CreateTenantDialog
                open={creating}
                onClose={() => setCreating(false)}
                onCreated={id => {
                    setCreating(false);
                    queryClient.invalidateQueries({ queryKey: ['tenants'] });
                    if (id) navigate(`/tenants/${id}`);
                }}
            />

            <ConfirmDialog
                open={!!pending}
                onClose={() => setPending(null)}
                onConfirm={() => act.mutate(pending)}
                loading={act.isPending}
                title={action?.title}
                message={action && action.message(pending.tenant)}
                confirmText={action?.confirmText}
                variant={action?.variant}
            />
        </div>
    );
}
