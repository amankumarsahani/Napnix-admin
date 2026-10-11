import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiArrowRight, FiEye, FiTrash2 } from 'react-icons/fi';
import { inquiriesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/common/Pagination';
import {
    Button, ConfirmDialog, DataTable, Dialog, EmptyState, IconButton, PageHeader, Panel, SearchInput,
    Select, StatusBadge, cx,
} from '../components/ui';

const PAGE_SIZE = 10;
const STATUSES = [['new', 'New'], ['contacted', 'Contacted'], ['resolved', 'Resolved']];
const formatDate = value => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Detail({ label, children }) {
    return (
        <div>
            <dt className="text-xs font-medium text-fg-muted">{label}</dt>
            <dd className="mt-0.5 text-sm text-fg break-words">{children || '—'}</dd>
        </div>
    );
}

export default function Inquiries() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const params = { page, limit: PAGE_SIZE, ...(search && { search }) };
    const query = useQuery({
        queryKey: ['inquiries', 'list', params],
        queryFn: () => inquiriesAPI.getAll(params),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const inquiries = query.data?.data || [];
    const pagination = query.data?.pagination;

    // ['inquiries'] also covers the sidebar's new-inquiry count
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inquiries'] });

    const setStatus = useMutation({
        mutationFn: ({ id, status }) => inquiriesAPI.updateStatus(id, status),
        onSuccess: () => { toast.success('Status updated'); invalidate(); },
        onError: () => toast.error('Failed to update status'),
    });
    const convert = useMutation({
        mutationFn: inquiry => inquiriesAPI.convertToLead(inquiry.id, { notes: inquiry.message }),
        onSuccess: () => {
            toast.success('Inquiry converted to lead');
            setViewing(null);
            invalidate();
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: err => toast.error(err.response?.data?.error || 'Failed to convert'),
    });
    const remove = useMutation({
        mutationFn: id => inquiriesAPI.delete(id),
        onSuccess: () => { toast.success('Inquiry deleted'); setDeleting(null); setViewing(null); invalidate(); },
        onError: () => toast.error('Failed to delete inquiry'),
    });

    return (
        <div className="space-y-4">
            <PageHeader
                title="Contact Inquiries"
                description="Manage contact form submissions from your website."
                actions={pagination && <span className="text-sm text-fg-muted">Total <span className="font-mono tabular-nums text-fg">{pagination.total}</span></span>}
            />

            <SearchInput value={search} onChange={term => { setSearch(term); setPage(1); }} placeholder="Search inquiries" label="Search inquiries" className="w-full sm:w-72" />

            <Panel flush>
                <DataTable
                    caption="Inquiries"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={inquiries}
                    onRowClick={inquiry => navigate(`/inquiries/${inquiry.id}`)}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search ? `No inquiries match “${search}”` : 'No inquiries yet'} description={search ? undefined : 'Website contact form submissions appear here.'} />}
                    columns={[
                        { key: 'name', header: 'Name', render: i => <span className="font-medium">{i.name}</span> },
                        { key: 'email', header: 'Email', className: 'text-fg-muted' },
                        { key: 'company', header: 'Company', render: i => i.company || <span className="text-fg-subtle">—</span> },
                        {
                            key: 'status', header: 'Status',
                            render: i => (i.status === 'converted' ? <StatusBadge entity="inquiry" status="converted" /> : (
                                <span onClick={e => e.stopPropagation()}>
                                    <Select
                                        aria-label={`Status for ${i.name}`}
                                        value={i.status}
                                        disabled={setStatus.isPending}
                                        onChange={e => setStatus.mutate({ id: i.id, status: e.target.value })}
                                        className="h-8 w-32 text-sm"
                                    >
                                        {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </Select>
                                </span>
                            )),
                        },
                        { key: 'createdAt', header: 'Received', className: 'whitespace-nowrap text-fg-muted', render: i => formatDate(i.createdAt) },
                    ]}
                    actions={i => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={`Quick view ${i.name}`} onClick={() => setViewing(i)}><FiEye className="size-4" /></IconButton>
                            {i.status !== 'converted' && (
                                <IconButton size="sm" label={`Convert ${i.name} to lead`} disabled={convert.isPending} onClick={() => convert.mutate(i)}><FiArrowRight className="size-4" /></IconButton>
                            )}
                            {isAdmin && <IconButton size="sm" variant="danger" label={`Delete inquiry from ${i.name}`} onClick={() => setDeleting(i)}><FiTrash2 className="size-4" /></IconButton>}
                        </span>
                    )}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <Dialog
                open={!!viewing}
                onClose={() => setViewing(null)}
                title="Inquiry details"
                size="lg"
                footer={viewing && (
                    <>
                        {isAdmin && <Button variant="danger" className="mr-auto" onClick={() => setDeleting(viewing)}><FiTrash2 className="size-4" />Delete</Button>}
                        <Button onClick={() => navigate(`/inquiries/${viewing.id}`)}>Open full page</Button>
                        {viewing.status !== 'converted' && (
                            <Button variant="primary" loading={convert.isPending} onClick={() => convert.mutate(viewing)}>Convert to lead</Button>
                        )}
                    </>
                )}
            >
                {viewing && (
                    <div className="space-y-4">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Detail label="Name">{viewing.name}</Detail>
                            <Detail label="Email">{viewing.email && <a href={`mailto:${viewing.email}`} className="text-accent hover:underline">{viewing.email}</a>}</Detail>
                            <Detail label="Phone">{viewing.phone && <a href={`tel:${viewing.phone}`} className="text-accent hover:underline">{viewing.phone}</a>}</Detail>
                            <Detail label="Company">{viewing.company}</Detail>
                            <Detail label="Status"><StatusBadge entity="inquiry" status={viewing.status} /></Detail>
                            <Detail label="Received">{formatDate(viewing.createdAt)}</Detail>
                        </dl>
                        <div>
                            <p className="text-xs font-medium text-fg-muted">Message</p>
                            <p className="mt-1 rounded-sm border border-border bg-surface-2 p-3 text-sm text-fg whitespace-pre-wrap">{viewing.message || '—'}</p>
                        </div>
                    </div>
                )}
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete inquiry?"
                message={deleting && `This deletes the inquiry from ${deleting.name}. This can't be undone.`}
                confirmText="Delete inquiry"
            />
        </div>
    );
}
