import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { nmCampaignsAPI } from '../../api/nexmail';
import Pagination from '../../components/common/Pagination';
import { Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, StatusBadge, cx } from '../../components/ui';

const PAGE_SIZE = 20;
const pct = (n, d) => (d > 0 ? ` (${Math.round((n / d) * 100)}%)` : '');

export default function Campaigns() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [deleting, setDeleting] = useState(null);

    const query = useQuery({
        queryKey: ['nexmail-campaigns', { page }],
        queryFn: () => nmCampaignsAPI.getAll({ page, limit: PAGE_SIZE }),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });
    const campaigns = query.data?.data || [];
    // nexmail returns { data, total, page, limit } (no pagination object)
    const total = query.data?.total;
    const pagination = total != null ? { total, pages: Math.ceil(total / PAGE_SIZE) } : null;

    // The old delete button was always invisible (opacity-0 inside a missing `group`), so campaigns could not be deleted
    const remove = useMutation({
        mutationFn: id => nmCampaignsAPI.delete(id),
        onSuccess: () => { toast.success('Campaign deleted'); setDeleting(null); queryClient.invalidateQueries({ queryKey: ['nexmail-campaigns'] }); },
        onError: err => toast.error(err.response?.data?.error || 'Failed to delete'),
    });

    const addButton = <Button variant="primary" onClick={() => navigate('/email-marketing/campaigns/new')}><FiPlus className="size-4" />New campaign</Button>;

    return (
        <div className="space-y-4">
            <PageHeader title="Campaigns" description={pagination?.total != null ? `${pagination.total} campaigns` : undefined} actions={addButton} />
            <Panel flush>
                <DataTable
                    caption="Email campaigns"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={campaigns}
                    onRowClick={c => navigate(`/email-marketing/campaigns/${c.id}`)}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title="No campaigns yet" description="Create your first campaign." action={addButton} />}
                    columns={[
                        { key: 'name', header: 'Campaign', render: c => (<span className="block min-w-0 max-w-sm"><span className="block truncate font-medium">{c.name}</span><span className="block truncate text-xs text-fg-subtle">{c.subject_a}</span></span>) },
                        { key: 'status', header: 'Status', render: c => <StatusBadge entity="emailCampaign" status={c.status} /> },
                        { key: 'sent', header: 'Sent', align: 'right', mono: true, render: c => (c.total_sent || 0).toLocaleString('en-IN') },
                        { key: 'opens', header: 'Opens', align: 'right', mono: true, render: c => `${c.total_opened || 0}${pct(c.total_opened, c.total_sent)}` },
                        { key: 'clicks', header: 'Clicks', align: 'right', mono: true, render: c => c.total_clicked || 0 },
                        { key: 'created', header: 'Created', className: 'whitespace-nowrap text-fg-muted', render: c => new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                    ]}
                    actions={c => <IconButton size="sm" variant="danger" label={`Delete ${c.name}`} onClick={() => setDeleting(c)}><FiTrash2 className="size-4" /></IconButton>}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border"><Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>
                )}
            </Panel>
            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete campaign?"
                message={deleting && `This deletes “${deleting.name}” and its stats. This can’t be undone.`}
                confirmText="Delete campaign"
            />
        </div>
    );
}
