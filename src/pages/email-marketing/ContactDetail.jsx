import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import { nmContactsAPI } from '../../api/nexmail';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Field, Input, PageHeader, Panel, Select, Skeleton, StatCard } from '../../components/ui';

// This page used to say "Contact #id details will be displayed here". It now shows the real record.
const STATUS_TONE = { subscribed: 'success', unsubscribed: 'neutral', bounced: 'danger', complained: 'warning', pending: 'warning' };
const STATUSES = ['subscribed', 'unsubscribed', 'pending', 'bounced', 'complained'];
const human = s => String(s || '').replace(/_/g, ' ');
const when = v => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;
const asObj = v => { if (!v) return {}; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch { return {}; } };
const asArr = v => { const x = typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return []; } })() : v; return Array.isArray(x) ? x : []; };

function ContactForm({ contact, onSave, saving }) {
    const [form, setForm] = useState({
        first_name: contact.first_name || '', last_name: contact.last_name || '', phone: contact.phone || '',
        company: contact.company || '', status: contact.status || 'subscribed',
    });
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name"><Input value={form.first_name} onChange={set('first_name')} /></Field>
                <Field label="Last name"><Input value={form.last_name} onChange={set('last_name')} /></Field>
                <Field label="Phone"><Input type="tel" value={form.phone} onChange={set('phone')} /></Field>
                <Field label="Company"><Input value={form.company} onChange={set('company')} /></Field>
                <Field label="Status" hint={form.status === 'unsubscribed' ? 'Unsubscribing also adds this email to the suppression list' : undefined}>
                    <Select value={form.status} onChange={set('status')}>{STATUSES.map(s => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}</Select>
                </Field>
            </div>
            <div className="flex justify-end"><Button variant="primary" type="submit" loading={saving}>Save contact</Button></div>
        </form>
    );
}

export default function ContactDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState(false);

    const query = useQuery({ queryKey: ['nexmail-contact', id], queryFn: () => nmContactsAPI.getById(id).then(r => r.data) });
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['nexmail-contact', id] });
        queryClient.invalidateQueries({ queryKey: ['nexmail-contacts'] });
    };
    const save = useMutation({
        mutationFn: form => nmContactsAPI.update(id, form),
        onSuccess: () => { toast.success('Contact updated'); refresh(); },
        onError: err => toast.error(apiErr(err, 'Failed to update contact')),
    });
    const remove = useMutation({
        mutationFn: () => nmContactsAPI.delete(id),
        onSuccess: () => { toast.success('Contact deleted'); queryClient.invalidateQueries({ queryKey: ['nexmail-contacts'] }); navigate('/email-marketing/contacts'); },
        onError: err => { toast.error(apiErr(err, 'Failed to delete contact')); setDeleting(false); },
    });

    if (query.isLoading) return <div className="max-w-5xl space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-24 rounded-md" /><Skeleton className="h-64 rounded-md" /></div>;
    if (query.isError || !query.data) return <ErrorState error={query.error || { message: 'Contact not found' }} onRetry={query.refetch} />;

    const c = query.data;
    const tags = asArr(c.tags);
    const activities = c.activities || [];
    const name = [c.first_name, c.last_name].filter(Boolean).join(' ');

    return (
        <div className="max-w-5xl space-y-4">
            <PageHeader
                back={{ to: '/email-marketing/contacts', label: 'Contacts' }}
                title={c.email}
                description={<span className="flex flex-wrap items-center gap-2">{name && <span>{name}</span>}<Badge tone={STATUS_TONE[c.status] || 'neutral'} className="capitalize">{c.status}</Badge></span>}
                actions={<Button variant="danger" onClick={() => setDeleting(true)}><FiTrash2 className="size-4" />Delete</Button>}
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Score" value={c.email_score ?? 0} />
                <StatCard label="Emails sent" value={c.email_count || 0} />
                <StatCard label="Opens" value={c.open_count || 0} />
                <StatCard label="Added" value={<span className="text-base">{when(c.created_at)}</span>} hint={c.source ? `Source: ${human(c.source)}` : undefined} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Panel title="Details"><ContactForm key={`${c.id}|${c.status}|${c.first_name}|${c.last_name}|${c.phone}|${c.company}`} contact={c} onSave={save.mutate} saving={save.isPending} /></Panel>
                </div>
                <div className="space-y-4">
                    <Panel title="Lists and tags">
                        <div className="space-y-3">
                            <div>
                                <p className="mb-1 text-xs font-medium text-fg-muted">Lists</p>
                                <div className="flex flex-wrap gap-1">{(c.lists || []).length ? c.lists.map(l => <Badge key={l.id} tone="info">{l.name}</Badge>) : <span className="text-sm text-fg-subtle">Not on any list</span>}</div>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-fg-muted">Tags</p>
                                <div className="flex flex-wrap gap-1">{tags.length ? tags.map(t => <Badge key={t}>{t}</Badge>) : <span className="text-sm text-fg-subtle">No tags</span>}</div>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>

            <Panel title="Activity" description="Most recent 50 events">
                {activities.length ? (
                    <ol className="divide-y divide-border">
                        {activities.map(a => {
                            const meta = asObj(a.metadata);
                            const detail = meta.subject || meta.url || meta.field || meta.tag || meta.list || '';
                            return (
                                <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 first:pt-0 last:pb-0">
                                    <span className="text-sm font-medium capitalize text-fg">{human(a.type)}</span>
                                    {detail && <span className="min-w-0 truncate text-sm text-fg-muted">{String(detail)}</span>}
                                    <span className="ml-auto whitespace-nowrap font-mono text-2xs text-fg-subtle">{when(a.created_at)}</span>
                                </li>
                            );
                        })}
                    </ol>
                ) : <EmptyState title="No activity yet" description="Sends, opens, clicks and list changes appear here." />}
            </Panel>

            <ConfirmDialog
                open={deleting}
                onClose={() => setDeleting(false)}
                onConfirm={() => remove.mutate()}
                loading={remove.isPending}
                title="Delete contact?"
                message={`This deletes ${c.email} and their activity history. This can’t be undone.`}
                confirmText="Delete contact"
            />
        </div>
    );
}
