import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCheck, FiClock, FiRefreshCw, FiX } from 'react-icons/fi';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import {
    Badge, Button, DataTable, Dialog, EmptyState, Field, Input, PageHeader, Panel, SearchInput, Tabs, cx,
} from '../../components/ui';

const PAGE_SIZE = 10;
const STATUS = {
    success: { tone: 'success', icon: FiCheck },
    failed: { tone: 'danger', icon: FiX },
    pending: { tone: 'warning', icon: FiClock },
};

// Each payment in its own currency (was always formatted as INR)
const money = (amount, currency = 'INR') => {
    try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: String(currency || 'INR').toUpperCase(), maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
        return `${currency} ${Number(amount || 0).toLocaleString('en-IN')}`;
    }
};

function StatusPill({ status }) {
    const key = String(status || 'pending').toLowerCase();
    const cfg = STATUS[key] || STATUS.pending;
    const Icon = cfg.icon;
    return <Badge tone={cfg.tone}><Icon aria-hidden="true" className="size-3" /><span className="capitalize">{status || 'pending'}</span></Badge>;
}

function SyncForm({ onDone }) {
    const queryClient = useQueryClient();
    const [paymentId, setPaymentId] = useState('');
    const sync = useMutation({
        mutationFn: async () => (await api.post('/billing/payments/sync', { provider: 'stripe', paymentId: paymentId.trim() })).data,
        onSuccess: data => {
            if (!data.success) { toast.error(data.message || 'Sync failed'); return; }
            toast.success('Transaction synced');
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            onDone();
        },
        onError: err => toast.error(err.response?.data?.error || 'Failed to sync transaction'),
    });
    return (
        <form id="sync-form" onSubmit={e => { e.preventDefault(); if (paymentId.trim()) sync.mutate(); }} className="space-y-4">
            <p className="text-sm text-fg-muted">Enter the Stripe Payment Intent ID (e.g., pi_3L...) to manually fetch and record it.</p>
            <Field label="Payment Intent ID" required>
                <Input value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="pi_1234567890..." className="font-mono" data-autofocus />
            </Field>
            <div className="flex justify-end gap-2">
                <Button onClick={onDone} disabled={sync.isPending}>Cancel</Button>
                <Button type="submit" variant="primary" loading={sync.isPending} disabled={!paymentId.trim()}>Sync Transaction</Button>
            </div>
        </form>
    );
}

export default function Transactions() {
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [syncOpen, setSyncOpen] = useState(false);

    const params = { page, limit: PAGE_SIZE, status, ...(search && { search }) };
    const query = useQuery({
        queryKey: ['payments', params],
        queryFn: async () => (await api.get('/billing/payments', { params })).data,
        staleTime: 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const rows = query.data?.data || [];
    const pagination = query.data?.pagination;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Transactions"
                description="All payments recorded from Stripe and manual billing."
                actions={<Button onClick={() => setSyncOpen(true)}><FiRefreshCw className="size-4" />Sync</Button>}
            />

            <Panel flush>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2 border-b border-border">
                    <Tabs
                        label="Payment status"
                        className="border-b-0"
                        value={status}
                        onChange={v => { setStatus(v); setPage(1); }}
                        tabs={[{ id: 'all', label: 'All' }, { id: 'success', label: 'Succeeded' }, { id: 'pending', label: 'Pending' }, { id: 'failed', label: 'Failed' }]}
                    />
                    <SearchInput value={search} onChange={t => { setSearch(t); setPage(1); }} placeholder="Customer, email or invoice #" label="Search transactions" className="w-full sm:w-64 pb-2" />
                </div>
                <DataTable
                    caption="Transactions"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={rows}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search || status !== 'all' ? 'No transactions match these filters' : 'No transactions yet'} />}
                    columns={[
                        { key: 'amount', header: 'Amount', align: 'right', mono: true, render: tx => money(tx.amount, tx.currency) },
                        { key: 'status', header: 'Status', render: tx => <StatusPill status={tx.status} /> },
                        {
                            key: 'description', header: 'Description',
                            render: tx => (
                                <span className="block">
                                    <span className="block font-medium">{tx.plan_name || 'One-time Payment'}</span>
                                    {tx.invoice_number && <span className="block font-mono text-xs text-fg-subtle">{tx.invoice_number}</span>}
                                </span>
                            ),
                        },
                        {
                            key: 'customer', header: 'Customer',
                            render: tx => (
                                <span className="block">
                                    <span className="block">{tx.tenant_name || 'Guest'}</span>
                                    <span className="block text-xs text-fg-subtle">{tx.tenant_email || '—'}</span>
                                </span>
                            ),
                        },
                        {
                            key: 'date', header: 'Date', className: 'whitespace-nowrap text-fg-muted',
                            render: tx => new Date(tx.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        },
                    ]}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <Dialog open={syncOpen} onClose={() => setSyncOpen(false)} title="Sync missing transaction" size="sm">
                {syncOpen && <SyncForm onDone={() => setSyncOpen(false)} />}
            </Dialog>
        </div>
    );
}
