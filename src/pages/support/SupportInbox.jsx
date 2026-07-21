import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    FiLifeBuoy, FiSearch, FiSend, FiRefreshCw, FiClock, FiUser,
    FiMessageSquare, FiChevronLeft, FiLock, FiInbox
} from 'react-icons/fi';
import { supportAPI } from '../../api';

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

const STATUS_CLS = {
    open:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    in_progress:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    waiting_customer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    resolved:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    closed:           'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};
const PRIORITY_CLS = {
    low:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    medium: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    high:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};
const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label || v;
const fmt = (d) => d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function SupportInbox() {
    const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
    const [activeId, setActiveId] = useState(null);

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['support-tickets', filters],
        queryFn: () => supportAPI.listTickets(filters),
        staleTime: 30 * 1000,
    });

    const tickets = data?.data || [];
    const stats = data?.stats || {};

    const cards = [
        { key: 'active', label: 'Active', value: stats.active || 0, cls: 'text-blue-600' },
        { key: 'open', label: 'Open', value: stats.open || 0, cls: 'text-sky-600' },
        { key: 'waiting_customer', label: 'Awaiting customer', value: stats.waiting_customer || 0, cls: 'text-violet-600' },
        { key: 'resolved', label: 'Resolved', value: stats.resolved || 0, cls: 'text-emerald-600' },
    ];

    return (
        <div className="px-4 py-6 sm:px-6">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                    <FiLifeBuoy className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Support Tickets</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tickets raised by tenants across all workspaces.</p>
                </div>
                <button onClick={() => refetch()} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cards.map((c) => (
                    <div key={c.key} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={filters.search}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                        placeholder="Search subject, ticket #, tenant…"
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                </div>
                <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                    <option value="">All priorities</option>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center text-slate-400"><FiRefreshCw className="h-6 w-6 animate-spin" /></div>
                ) : tickets.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                        <FiInbox className="h-8 w-8" /> <span className="text-sm">No tickets match these filters.</span>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tickets.map((t) => (
                            <li key={t.id}>
                                <button onClick={() => setActiveId(t.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{t.subject}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_CLS[t.priority]}`}>{t.priority}</span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                            <span className="font-mono">{t.ticket_no}</span>
                                            <span>·</span>
                                            <span className="font-medium text-slate-500 dark:text-slate-300">{t.tenant_name || t.tenant_slug}</span>
                                            <span>·</span>
                                            <span className="inline-flex items-center gap-1"><FiUser className="h-3 w-3" />{t.requester_name || '—'}</span>
                                            <span>·</span>
                                            <span className="inline-flex items-center gap-1"><FiMessageSquare className="h-3 w-3" />{t.message_count}</span>
                                            <span>·</span>
                                            <span className="inline-flex items-center gap-1"><FiClock className="h-3 w-3" />{fmt(t.last_message_at || t.created_at)}</span>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[t.status]}`}>{statusLabel(t.status)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {activeId && <TicketDrawer id={activeId} onClose={() => setActiveId(null)} />}
        </div>
    );
}

function TicketDrawer({ id, onClose }) {
    const qc = useQueryClient();
    const [reply, setReply] = useState('');
    const [internal, setInternal] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['support-ticket', id],
        queryFn: () => supportAPI.getTicket(id),
    });
    const ticket = data?.data;

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['support-ticket', id] });
        qc.invalidateQueries({ queryKey: ['support-tickets'] });
    };

    const replyMut = useMutation({
        mutationFn: () => supportAPI.reply(id, reply.trim(), internal),
        onSuccess: () => { setReply(''); setInternal(false); invalidate(); },
        onError: (e) => toast.error(e.response?.data?.error || 'Failed to send'),
    });

    const updateMut = useMutation({
        mutationFn: (patch) => supportAPI.update(id, patch),
        onSuccess: () => { invalidate(); toast.success('Ticket updated'); },
        onError: (e) => toast.error(e.response?.data?.error || 'Failed to update'),
    });

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
            <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                {isLoading || !ticket ? (
                    <div className="flex flex-1 items-center justify-center text-slate-400"><FiRefreshCw className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <>
                        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                            <div className="flex items-start gap-3">
                                <button onClick={onClose} className="mt-0.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><FiChevronLeft className="h-5 w-5" /></button>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">{ticket.subject}</h2>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        <span className="font-mono">{ticket.ticket_no}</span> · {ticket.tenant_name || ticket.tenant_slug} · {ticket.requester_name} ({ticket.requester_email})
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <select value={ticket.status} onChange={(e) => updateMut.mutate({ status: e.target.value })} className={`rounded-lg border-0 px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[ticket.status]}`}>
                                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <select value={ticket.priority} onChange={(e) => updateMut.mutate({ priority: e.target.value })} className={`rounded-lg border-0 px-2.5 py-1 text-xs font-semibold ${PRIORITY_CLS[ticket.priority]}`}>
                                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">{ticket.category}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5 dark:bg-slate-800/40">
                            {(ticket.messages || []).map((m) => {
                                const agency = m.author_type === 'agency';
                                if (m.is_internal_note) {
                                    return (
                                        <div key={m.id} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-900/40 dark:bg-amber-900/20">
                                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300"><FiLock className="h-3 w-3" /> Internal note · {m.author_name} · {fmt(m.created_at)}</div>
                                            <p className="whitespace-pre-wrap text-amber-900 dark:text-amber-100">{m.body}</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={m.id} className={`flex ${agency ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${agency ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                                            <div className={`mb-1 flex items-center gap-2 text-[11px] ${agency ? 'text-blue-100' : 'text-slate-400'}`}>
                                                <span className="font-semibold">{m.author_name || (agency ? 'Support' : 'Customer')}</span>
                                                <span>{fmt(m.created_at)}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-slate-100 p-4 dark:border-slate-700">
                            <textarea
                                value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
                                placeholder={internal ? 'Internal note — the customer will NOT see this…' : 'Reply to the customer…'}
                                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                            <div className="mt-2 flex items-center justify-between">
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="rounded border-slate-300" />
                                    <FiLock className="h-3.5 w-3.5" /> Internal note
                                </label>
                                <button
                                    onClick={() => reply.trim() && replyMut.mutate()}
                                    disabled={replyMut.isPending || !reply.trim()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {replyMut.isPending ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />} {internal ? 'Add note' : 'Send reply'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
