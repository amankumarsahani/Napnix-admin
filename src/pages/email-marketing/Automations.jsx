import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { nmAutomationsAPI } from '../../api/nexmail';
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, Switch } from '../../components/ui';

// This page used to render a permanently empty list with two buttons that did nothing.
const STATUS_TONE = { active: 'success', paused: 'warning', draft: 'neutral' };
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;

export default function Automations() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState(null);

    const query = useQuery({ queryKey: ['nexmail-automations'], queryFn: () => nmAutomationsAPI.getAll().then(r => r.data || []), staleTime: 60 * 1000 });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['nexmail-automations'] });

    const toggle = useMutation({
        mutationFn: a => (a.status === 'active' ? nmAutomationsAPI.pause(a.id) : nmAutomationsAPI.activate(a.id)),
        onSuccess: (_, a) => { toast.success(a.status === 'active' ? 'Automation paused' : 'Automation activated'); refresh(); },
        onError: err => toast.error(apiErr(err, 'Could not change the automation')),
    });
    const remove = useMutation({
        mutationFn: a => nmAutomationsAPI.delete(a.id),
        onSuccess: () => { toast.success('Automation deleted'); setDeleting(null); refresh(); },
        onError: err => { toast.error(apiErr(err, 'Failed to delete')); setDeleting(null); },
    });

    const addButton = <Button variant="primary" onClick={() => navigate('/email-marketing/automations/new')}><FiPlus className="size-4" />New automation</Button>;

    return (
        <div className="space-y-4">
            <PageHeader title="Automations" description="Automated email sequences and drip campaigns" actions={addButton} />
            <Panel flush>
                <DataTable
                    caption="Automations"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={query.data || []}
                    onRowClick={a => navigate(`/email-marketing/automations/${a.id}/edit`)}
                    empty={<EmptyState title="No automations yet" description="Set up a welcome series, a re-engagement flow or a drip campaign." action={addButton} />}
                    columns={[
                        { key: 'name', header: 'Automation', render: a => (<span className="block min-w-0 max-w-sm"><span className="block truncate font-medium">{a.name}</span>{a.description && <span className="block truncate text-xs text-fg-subtle">{a.description}</span>}</span>) },
                        { key: 'trigger', header: 'Trigger', className: 'capitalize text-fg-muted', render: a => String(a.trigger_type || '').replace(/_/g, ' ') },
                        { key: 'status', header: 'Status', render: a => <Badge tone={STATUS_TONE[a.status] || 'neutral'} className="capitalize">{a.status}</Badge> },
                        { key: 'entries', header: 'Enrolled', align: 'right', mono: true, render: a => (a.entry_count || 0).toLocaleString('en-IN') },
                        { key: 'done', header: 'Completed', align: 'right', mono: true, render: a => (a.completed_count || 0).toLocaleString('en-IN') },
                        {
                            key: 'active', header: 'Active',
                            render: a => (
                                // Row click opens the editor, so the switch must not bubble
                                <span onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
                                    <Switch checked={a.status === 'active'} onChange={() => toggle.mutate(a)} disabled={toggle.isPending} hideLabel label={`${a.status === 'active' ? 'Pause' : 'Activate'} ${a.name}`} />
                                </span>
                            ),
                        },
                    ]}
                    actions={a => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={`Edit ${a.name}`} onClick={() => navigate(`/email-marketing/automations/${a.id}/edit`)}><FiEdit2 className="size-4" /></IconButton>
                            <IconButton size="sm" variant="danger" label={`Delete ${a.name}`} onClick={() => setDeleting(a)}><FiTrash2 className="size-4" /></IconButton>
                        </span>
                    )}
                />
            </Panel>
            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting)}
                loading={remove.isPending}
                title="Delete automation?"
                message={deleting && `This deletes “${deleting.name}” and stops anyone currently enrolled. This can’t be undone.`}
                confirmText="Delete automation"
            />
        </div>
    );
}
