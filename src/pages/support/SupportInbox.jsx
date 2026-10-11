import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiClock, FiInbox, FiLock, FiMessageSquare, FiRefreshCw, FiSend, FiUser } from 'react-icons/fi';
import { supportAPI } from '../../api';
import {
    Avatar, Badge, Button, Checkbox, Drawer, EmptyState, ErrorState, Field, PageHeader, Panel, QueryState,
    SearchInput, Select, SkeletonRows, StatCard, StatusBadge, Textarea, cx,
} from '../../components/ui';

const STATUSES = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'waiting_customer', label: 'Waiting on customer' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
];
const PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];
const statusLabel = v => STATUSES.find(s => s.value === v)?.label || v;
const priorityLabel = v => PRIORITIES.find(p => p.value === v)?.label || v;
const fmt = d => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function SupportInbox() {
    // Default filter object must stay identical to the sidebar's count query so they share one cache entry
    const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
    const [activeId, setActiveId] = useState(null);

    const query = useQuery({
        queryKey: ['support-tickets', filters],
        queryFn: () => supportAPI.listTickets(filters),
        staleTime: 30 * 1000,
    });
    const tickets = query.data?.data || [];
    const stats = query.data?.stats || {};
    const filtered = filters.status || filters.priority || filters.search;

    return (
        <div className="max-w-6xl mx-auto space-y-4">
            <PageHeader
                title="Support Tickets"
                description="Tickets raised by tenants across all workspaces."
                actions={
                    <Button onClick={() => query.refetch()} disabled={query.isFetching}>
                        <FiRefreshCw className={cx('size-4', query.isFetching && 'animate-spin')} />Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Active" value={stats.active || 0} />
                <StatCard label="Open" value={stats.open || 0} />
                <StatCard label="Awaiting customer" value={stats.waiting_customer || 0} />
                <StatCard label="Resolved" value={stats.resolved || 0} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.search}
                    onChange={search => setFilters(f => ({ ...f, search }))}
                    placeholder="Search subject, ticket #, tenant…"
                    label="Search tickets"
                    className="flex-1 min-w-52"
                />
                <Select aria-label="Filter by status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-auto">
                    <option value="">All statuses</option>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
                <Select aria-label="Filter by priority" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="w-auto">
                    <option value="">All priorities</option>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </Select>
            </div>

            <Panel flush>
                <QueryState
                    query={query}
                    select={d => d?.data || []}
                    skeleton={<SkeletonRows rows={6} />}
                    empty={<EmptyState icon={<FiInbox className="size-6" />} title={filtered ? 'No tickets match these filters' : 'No tickets yet'} />}
                >
                    {() => (
                        <ul className="divide-y divide-border">
                            {tickets.map(t => (
                                <li key={t.id}>
                                    <button type="button" onClick={() => setActiveId(t.id)}
                                        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-surface-2 focus-visible:bg-surface-2">
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2">
                                                <span className="truncate text-sm font-medium text-fg">{t.subject}</span>
                                                <StatusBadge entity="ticketPriority" status={t.priority} label={priorityLabel(t.priority)} />
                                            </span>
                                            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                                                <span className="font-mono">{t.ticket_no}</span>
                                                <span className="font-medium text-fg-muted">{t.tenant_name || t.tenant_slug}</span>
                                                <span className="inline-flex items-center gap-1"><FiUser aria-hidden="true" className="size-3" />{t.requester_name || '—'}</span>
                                                <span className="inline-flex items-center gap-1"><FiMessageSquare aria-hidden="true" className="size-3" /><span className="sr-only">Messages:</span>{t.message_count}</span>
                                                <span className="inline-flex items-center gap-1"><FiClock aria-hidden="true" className="size-3" />{fmt(t.last_message_at || t.created_at)}</span>
                                            </span>
                                        </span>
                                        <StatusBadge entity="ticket" status={t.status} label={statusLabel(t.status)} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </QueryState>
            </Panel>

            <Drawer open={!!activeId} onClose={() => setActiveId(null)} title="Ticket">
                {activeId && <TicketPanel key={activeId} id={activeId} />}
            </Drawer>
        </div>
    );
}

function TicketPanel({ id }) {
    const qc = useQueryClient();
    const [reply, setReply] = useState('');
    const [internal, setInternal] = useState(false);

    const query = useQuery({
        queryKey: ['support-ticket', id],
        queryFn: () => supportAPI.getTicket(id),
    });
    const ticket = query.data?.data;

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['support-ticket', id] });
        qc.invalidateQueries({ queryKey: ['support-tickets'] }); // list, stats and sidebar count
    };

    const replyMut = useMutation({
        mutationFn: () => supportAPI.reply(id, reply.trim(), internal),
        onSuccess: () => { setReply(''); setInternal(false); invalidate(); toast.success(internal ? 'Note added' : 'Reply sent'); },
        onError: e => toast.error(e.response?.data?.error || 'Failed to send'),
    });
    const updateMut = useMutation({
        mutationFn: patch => supportAPI.update(id, patch),
        onSuccess: () => { invalidate(); toast.success('Ticket updated'); },
        onError: e => toast.error(e.response?.data?.error || 'Failed to update'),
    });

    if (query.isLoading) return <div className="p-5"><SkeletonRows rows={6} /></div>;
    if (query.isError || !ticket) return <ErrorState error={query.error} onRetry={query.refetch} />;

    const send = () => { if (reply.trim() && !replyMut.isPending) replyMut.mutate(); };

    return (
        <>
            <div className="px-5 py-4 border-b border-border space-y-3">
                <div>
                    <h3 className="text-base font-semibold text-fg">{ticket.subject}</h3>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                        <span className="font-mono">{ticket.ticket_no}</span> · {ticket.tenant_name || ticket.tenant_slug} · {ticket.requester_name} ({ticket.requester_email})
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select aria-label="Status" value={ticket.status} disabled={updateMut.isPending} onChange={e => updateMut.mutate({ status: e.target.value })} className="h-8 w-auto text-sm">
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                    <Select aria-label="Priority" value={ticket.priority} disabled={updateMut.isPending} onChange={e => updateMut.mutate({ priority: e.target.value })} className="h-8 w-auto text-sm">
                        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </Select>
                    {ticket.category && <Badge>{ticket.category}</Badge>}
                </div>
            </div>

            <ol className="flex-1 overflow-y-auto bg-surface-2 p-5 space-y-3">
                {(ticket.messages || []).map(m => {
                    const agency = m.author_type === 'agency';
                    if (m.is_internal_note) {
                        return (
                            <li key={m.id} className="rounded-sm border border-warning/30 bg-warning-soft px-4 py-2.5 text-sm">
                                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-warning">
                                    <FiLock aria-hidden="true" className="size-3" /> Internal note · {m.author_name} · {fmt(m.created_at)}
                                </p>
                                <p className="whitespace-pre-wrap text-fg">{m.body}</p>
                            </li>
                        );
                    }
                    return (
                        <li key={m.id} className="rounded-sm border border-border bg-surface p-4">
                            <div className="mb-2 flex items-center gap-2.5">
                                <Avatar name={agency ? 'Support' : (m.author_name || 'Customer')} size="sm" />
                                <span className="truncate text-sm font-medium text-fg">{m.author_name || (agency ? 'Support' : 'Customer')}</span>
                                <Badge tone={agency ? 'info' : 'neutral'}>{agency ? 'Support' : 'Customer'}</Badge>
                                <span className="ml-auto text-xs text-fg-subtle">{fmt(m.created_at)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{m.body}</p>
                        </li>
                    );
                })}
            </ol>

            <form className="border-t border-border p-4 space-y-2" onSubmit={e => { e.preventDefault(); send(); }}>
                <Field label={internal ? 'Internal note' : 'Reply'} hint={internal ? 'The customer will NOT see this.' : 'Ctrl+Enter to send.'}>
                    <Textarea
                        rows={3}
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
                        placeholder={internal ? 'Note for the team…' : 'Reply to the customer…'}
                        className={cx(internal && 'bg-warning-soft')}
                    />
                </Field>
                <div className="flex items-center justify-between">
                    <Checkbox label={<span className="inline-flex items-center gap-1.5"><FiLock aria-hidden="true" className="size-3.5" />Internal note</span>} checked={internal} onChange={e => setInternal(e.target.checked)} />
                    <Button type="submit" variant="primary" loading={replyMut.isPending} disabled={!reply.trim()}>
                        {!replyMut.isPending && <FiSend className="size-4" />}{internal ? 'Add note' : 'Send reply'}
                    </Button>
                </div>
            </form>
        </>
    );
}
