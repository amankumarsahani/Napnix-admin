import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiClock, FiEdit2, FiGlobe, FiInbox, FiMessageCircle, FiPlay, FiPlus, FiTrash2, FiUser, FiZap } from 'react-icons/fi';
import { workflowsAPI } from '../../api';
import {
    Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, SearchInput, StatCard, Switch,
} from '../../components/ui';

// Workflows are few; load them all so the stats cover every workflow, not one page
const LIMIT = 200;

const TRIGGERS = {
    lead_created: ['Lead created', FiUser], client_created: ['Client created', FiUser],
    lead_status_changed: ['Lead status changed', FiUser], client_status_changed: ['Client status changed', FiUser],
    inquiry_created: ['Inquiry created', FiInbox], inquiry_status_updated: ['Inquiry status updated', FiInbox],
    tenant_created: ['Tenant created', FiZap], scheduled: ['Scheduled', FiClock], trigger_schedule: ['Scheduled', FiClock],
    manual: ['Manual', FiPlay], webhook_received: ['Incoming webhook', FiGlobe],
    whatsapp_message_received: ['WhatsApp message', FiMessageCircle],
    stripe_payment_received: ['Stripe payment', FiZap], stripe_subscription_created: ['Stripe subscription created', FiZap],
    stripe_subscription_cancelled: ['Stripe subscription cancelled', FiZap], stripe_invoice_paid: ['Stripe invoice paid', FiZap],
};
const trigger = type => TRIGGERS[type] || [String(type || 'unknown').replace(/_/g, ' '), FiZap];

export default function Workflows() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [testing, setTesting] = useState(null);

    const query = useQuery({
        queryKey: ['workflows'],
        queryFn: () => workflowsAPI.getAll({ page: 1, limit: LIMIT }),
        staleTime: 30 * 1000,
    });
    const all = query.data?.data || [];
    const total = query.data?.pagination?.total ?? all.length;
    // The API has no search param; filter the loaded list here
    const term = search.trim().toLowerCase();
    const workflows = term ? all.filter(w => `${w.name} ${w.description || ''}`.toLowerCase().includes(term)) : all;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workflows'] });
    const toggle = useMutation({
        mutationFn: wf => workflowsAPI.toggle(wf.id),
        onSuccess: (_, wf) => { toast.success(wf.is_active ? 'Workflow deactivated' : 'Workflow activated'); invalidate(); },
        onError: () => toast.error('Failed to toggle workflow'),
    });
    const remove = useMutation({
        mutationFn: wf => workflowsAPI.delete(wf.id),
        onSuccess: () => { toast.success('Workflow deleted'); setDeleting(null); invalidate(); },
        onError: () => toast.error('Failed to delete workflow'),
    });
    const test = useMutation({
        mutationFn: wf => workflowsAPI.test(wf.id),
        onSuccess: () => { toast.success('Workflow started — check its run log'); setTesting(null); invalidate(); },
        onError: () => { toast.error('Failed to run workflow'); setTesting(null); },
    });

    const active = all.filter(w => w.is_active).length;
    const runs = all.reduce((sum, w) => sum + (w.execution_count || 0), 0);
    const ok = all.reduce((sum, w) => sum + (w.success_count || 0), 0);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Automation Workflows"
                description="Create automated workflows to streamline your processes."
                actions={<Button variant="primary" onClick={() => navigate('/workflows/new')}><FiPlus className="size-4" />Create Workflow</Button>}
            />
            <SearchInput value={search} onChange={setSearch} delay={0} placeholder="Search workflows" label="Search workflows" className="w-full sm:w-72" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Workflows" value={total} />
                <StatCard label="Active" value={active} />
                <StatCard label="Total runs" value={runs} />
                <StatCard label="Successful runs" value={ok} hint={runs ? `${Math.round((ok / runs) * 100)}% success` : undefined} />
            </div>

            <Panel flush>
                <DataTable
                    caption="Workflows"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={workflows}
                    onRowClick={wf => navigate(`/workflows/${wf.id}/edit`)}
                    empty={
                        <EmptyState
                            title={search ? `No workflows match “${search}”` : 'No workflows yet'}
                            description={search ? undefined : 'Create your first automation workflow to get started.'}
                            action={!search && <Button variant="primary" size="sm" onClick={() => navigate('/workflows/new')}><FiPlus className="size-4" />Create Workflow</Button>}
                        />
                    }
                    columns={[
                        {
                            key: 'name', header: 'Workflow',
                            render: wf => (
                                <span className="block max-w-lg">
                                    <span className="block font-medium">{wf.name}</span>
                                    <span className="block text-xs text-fg-subtle truncate">{wf.description || 'No description'}</span>
                                </span>
                            ),
                        },
                        {
                            key: 'trigger', header: 'Trigger',
                            render: wf => {
                                const [label, Icon] = trigger(wf.trigger_type);
                                return <span className="inline-flex items-center gap-2 text-sm text-fg-muted whitespace-nowrap"><Icon aria-hidden="true" className="size-4 text-fg-subtle" />{label}</span>;
                            },
                        },
                        {
                            key: 'active', header: 'Active',
                            render: wf => (
                                <span onClick={e => e.stopPropagation()}>
                                    <Switch
                                        checked={!!wf.is_active}
                                        disabled={toggle.isPending}
                                        onChange={() => toggle.mutate(wf)}
                                        label={<span className="sr-only">{wf.is_active ? 'Deactivate' : 'Activate'} {wf.name}</span>}
                                    />
                                </span>
                            ),
                        },
                        {
                            key: 'runs', header: 'Runs',
                            render: wf => (
                                <span className="text-sm whitespace-nowrap">
                                    <span className="font-mono tabular-nums">{wf.execution_count || 0}</span>
                                    {wf.success_count > 0 && <span className="text-fg-subtle"> · {wf.success_count} ok</span>}
                                </span>
                            ),
                        },
                    ]}
                    actions={wf => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={`Run ${wf.name} now`} onClick={() => setTesting(wf)}><FiPlay className="size-4" /></IconButton>
                            <IconButton size="sm" label={`Edit ${wf.name}`} onClick={() => navigate(`/workflows/${wf.id}/edit`)}><FiEdit2 className="size-4" /></IconButton>
                            <IconButton size="sm" variant="danger" label={`Delete ${wf.name}`} onClick={() => setDeleting(wf)}><FiTrash2 className="size-4" /></IconButton>
                        </span>
                    )}
                />
            </Panel>

            <ConfirmDialog
                open={!!testing}
                onClose={() => setTesting(null)}
                onConfirm={() => test.mutate(testing)}
                loading={test.isPending}
                variant="primary"
                title="Run this workflow now?"
                message={testing && `"${testing.name}" runs for real: any emails, messages, blog posts or webhooks in it will actually happen.`}
                confirmText="Run now"
            />
            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting)}
                loading={remove.isPending}
                title="Delete workflow?"
                message={deleting && `This deletes "${deleting.name}" and its run history. This can't be undone.`}
                confirmText="Delete workflow"
            />
        </div>
    );
}
