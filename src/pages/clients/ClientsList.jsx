import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import { clientsAPI } from '../../api';
import Pagination from '../../components/common/Pagination';
import PaymentLinkDialog from '../../components/billing/PaymentLinkDialog';
import {
    Avatar, Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, SearchInput, StatusBadge, cx,
} from '../../components/ui';
import ClientFormDialog from './ClientFormDialog';

const PAGE_SIZE = 10;

export default function ClientsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [formClient, setFormClient] = useState(null); // null closed, {} new, client edit
    const [deleting, setDeleting] = useState(null);
    const [linkClient, setLinkClient] = useState(null);

    const params = { page, limit: PAGE_SIZE, ...(search && { search }) };
    const query = useQuery({
        queryKey: ['clients', params],
        queryFn: () => clientsAPI.getAll(params),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const data = query.data;
    const clients = data ? (Array.isArray(data) ? data : data.clients || []) : [];
    const pagination = data?.pagination;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clients'] });

    const save = useMutation({
        mutationFn: ({ id, values }) => (id ? clientsAPI.update(id, values) : clientsAPI.create(values)),
        onSuccess: (_, { id }) => { toast.success(id ? 'Client updated' : 'Client created'); setFormClient(null); invalidate(); },
        onError: err => toast.error(err.response?.data?.message || err.response?.data?.error || 'Could not save the client'),
    });
    const remove = useMutation({
        mutationFn: id => clientsAPI.delete(id),
        onSuccess: () => { toast.success('Client deleted'); setDeleting(null); invalidate(); },
        onError: () => toast.error('Failed to delete client'),
    });

    return (
        <div className="space-y-4">
            <PageHeader
                title="Clients"
                description={pagination ? `${pagination.total} clients` : undefined}
                actions={<Button variant="primary" onClick={() => setFormClient({})}><FiPlus className="size-4" />Add Client</Button>}
            />

            <SearchInput value={search} onChange={term => { setSearch(term); setPage(1); }} placeholder="Search clients" label="Search clients" className="w-full sm:w-72" />

            <Panel flush>
                <DataTable
                    caption="Clients"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={clients}
                    onRowClick={c => navigate(`/clients/${c.id}`)}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={
                        <EmptyState
                            title={search ? `No clients match “${search}”` : 'No clients yet'}
                            description={search ? undefined : 'Add a client, or convert a won lead.'}
                            action={!search && <Button variant="primary" size="sm" onClick={() => setFormClient({})}><FiPlus className="size-4" />Add Client</Button>}
                        />
                    }
                    columns={[
                        {
                            key: 'companyName', header: 'Company',
                            render: c => (
                                <span className="flex items-center gap-2.5">
                                    <Avatar name={c.companyName} />
                                    <span className="font-medium">{c.companyName}</span>
                                </span>
                            ),
                        },
                        { key: 'contactName', header: 'Contact' },
                        { key: 'email', header: 'Email', className: 'text-fg-muted' },
                        { key: 'phone', header: 'Phone', className: 'text-fg-muted whitespace-nowrap', render: c => c.phone || <span className="text-fg-subtle">—</span> },
                        { key: 'status', header: 'Status', render: c => <StatusBadge entity="client" status={c.status} /> },
                    ]}
                    actions={c => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label="Generate payment link" onClick={() => setLinkClient(c)}><FiLink className="size-4" /></IconButton>
                            <IconButton size="sm" label={`Edit ${c.companyName}`} onClick={() => setFormClient(c)}><FiEdit2 className="size-4" /></IconButton>
                            <IconButton size="sm" variant="danger" label={`Delete ${c.companyName}`} onClick={() => setDeleting(c)}><FiTrash2 className="size-4" /></IconButton>
                        </span>
                    )}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <ClientFormDialog
                open={!!formClient}
                client={formClient}
                onClose={() => setFormClient(null)}
                saving={save.isPending}
                onSubmit={values => save.mutate({ id: formClient?.id, values })}
            />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete client?"
                message={deleting && `This deletes ${deleting.companyName}. This can't be undone.`}
                confirmText="Delete client"
            />

            <PaymentLinkDialog
                open={!!linkClient}
                onClose={() => setLinkClient(null)}
                entity={linkClient && { type: 'client', id: linkClient.id, name: linkClient.contactName || linkClient.companyName }}
            />
        </div>
    );
}
