import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit3, FiMail, FiPhone, FiRefreshCw, FiUsers } from 'react-icons/fi';
import apiClient from '../../api/axios';
import { activityQueryKey } from './activityKeys';
import { Button, EmptyState, Field, QueryState, SkeletonRows, Tabs, Textarea, cx } from '../ui';

const ACTIVITY_TYPES = {
    note: { label: 'Note', icon: FiEdit3 },
    call: { label: 'Call', icon: FiPhone },
    email: { label: 'Email', icon: FiMail },
    meeting: { label: 'Meeting', icon: FiUsers },
    status_change: { label: 'Status change', icon: FiRefreshCw },
};

const relativeTime = (value) => {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Timeline + "add activity" for a lead, client or inquiry (shared /activities API).
 * Other parts of the page refresh it with invalidateQueries(activityQueryKey(type, id)).
 */
export default function ActivityTimeline({ entityType, entityId }) {
    const queryClient = useQueryClient();
    const key = activityQueryKey(entityType, entityId);
    const [tab, setTab] = useState('timeline');
    const [type, setType] = useState('note');
    const [details, setDetails] = useState('');

    const query = useQuery({
        queryKey: key,
        queryFn: async () => (await apiClient.get(`/activities/${entityType}/${entityId}`)).data?.data || [],
        staleTime: 2 * 60 * 1000,
    });

    const add = useMutation({
        mutationFn: () => apiClient.post('/activities', {
            entityType, entityId, type, summary: `${ACTIVITY_TYPES[type].label} logged`, details,
        }),
        onSuccess: () => {
            toast.success('Activity added');
            setDetails('');
            setTab('timeline');
            queryClient.invalidateQueries({ queryKey: key });
        },
        onError: () => toast.error('Failed to add activity'),
    });

    const count = query.data?.length;

    return (
        <section className="rounded-md border border-border bg-surface">
            <Tabs
                className="px-2"
                label="Activity"
                value={tab}
                onChange={setTab}
                tabs={[{ id: 'timeline', label: 'Timeline', count: count ?? undefined }, { id: 'add', label: 'Add activity' }]}
            />
            <div className="p-4">
                {tab === 'add' ? (
                    <form onSubmit={e => { e.preventDefault(); if (details.trim()) add.mutate(); }} className="space-y-4">
                        <div role="radiogroup" aria-label="Activity type" className="flex flex-wrap gap-1.5">
                            {Object.entries(ACTIVITY_TYPES).filter(([k]) => k !== 'status_change').map(([k, cfg]) => {
                                const Icon = cfg.icon;
                                return (
                                    <button key={k} type="button" role="radio" aria-checked={type === k} onClick={() => setType(k)}
                                        className={cx('inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border text-sm',
                                            type === k ? 'border-accent bg-accent-soft text-accent' : 'border-border text-fg-muted hover:text-fg')}>
                                        <Icon aria-hidden="true" className="size-3.5" />{cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                        <Field label="Details">
                            <Textarea rows={5} value={details} onChange={e => setDetails(e.target.value)} placeholder="Add details about this activity..." />
                        </Field>
                        <Button type="submit" variant="primary" loading={add.isPending} disabled={!details.trim()}>Add activity</Button>
                    </form>
                ) : (
                    <QueryState
                        query={query}
                        skeleton={<SkeletonRows rows={4} />}
                        empty={<EmptyState title="No activity yet" action={<Button size="sm" onClick={() => setTab('add')}>Add the first activity</Button>} />}
                    >
                        {activities => (
                            <ol className="relative space-y-4 before:absolute before:left-3.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
                                {activities.map(a => {
                                    const cfg = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.note;
                                    const Icon = cfg.icon;
                                    return (
                                        <li key={a.id} className="relative pl-10">
                                            <span aria-hidden="true" className="absolute left-0 top-0.5 size-7 grid place-items-center rounded-full border border-border bg-surface-2 text-fg-muted">
                                                <Icon className="size-3.5" />
                                            </span>
                                            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                                <p className="text-sm font-medium text-fg">{a.summary}</p>
                                                <time dateTime={a.createdAt} title={new Date(a.createdAt).toLocaleString('en-IN')} className="text-xs text-fg-subtle">
                                                    {relativeTime(a.createdAt)}
                                                </time>
                                            </div>
                                            {a.details && <p className="mt-0.5 text-sm text-fg-muted whitespace-pre-wrap">{a.details}</p>}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </QueryState>
                )}
            </div>
        </section>
    );
}
