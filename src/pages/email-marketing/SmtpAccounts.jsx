import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { nmSmtpAPI } from '../../api/nexmail';
import {
    Badge, Button, Checkbox, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel, Skeleton,
} from '../../components/ui';

const PRESETS = [
    { name: 'Zoho India', host: 'smtp.zoho.in', port: 465, secure: true },
    { name: 'Zoho Global', host: 'smtp.zoho.com', port: 465, secure: true },
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
    { name: 'Outlook', host: 'smtp.office365.com', port: 587, secure: false },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: false },
];
const EMPTY = { name: '', host: '', port: '587', secure: false, username: '', password: '', from_email: '', from_name: '', daily_limit: '500', is_default: false };
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;

function AccountForm({ onSave, onTest, testing, saving }) {
    const [form, setForm] = useState(EMPTY);
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const ready = form.host && form.username && form.password;
    const payload = () => ({ ...form, port: parseInt(form.port, 10), daily_limit: parseInt(form.daily_limit, 10) });
    return (
        <>
            <form id="smtp-form" onSubmit={e => { e.preventDefault(); onSave(payload()); }} className="space-y-4">
                <div>
                    <p className="mb-1.5 text-sm font-medium text-fg">Presets</p>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map(p => (
                            <Button key={p.name} size="sm" onClick={() => setForm(f => ({ ...f, name: p.name, host: p.host, port: String(p.port), secure: p.secure }))}>{p.name}</Button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Account name"><Input value={form.name} onChange={set('name')} placeholder="e.g. Zoho India main" /></Field>
                    <Field label="SMTP host" required><Input required value={form.host} onChange={set('host')} placeholder="smtp.zoho.in" className="font-mono" /></Field>
                    <Field label="Port"><Input type="number" min="1" max="65535" value={form.port} onChange={set('port')} className="font-mono" /></Field>
                    <Field label="Daily send limit"><Input type="number" min="1" value={form.daily_limit} onChange={set('daily_limit')} className="font-mono" /></Field>
                    <Field label="Username" required hint="Usually the full mailbox address"><Input required value={form.username} onChange={set('username')} /></Field>
                    <Field label="Password or app password" required><Input type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
                    <Field label="From email" hint="The sender address recipients see"><Input type="email" value={form.from_email} onChange={set('from_email')} /></Field>
                    <Field label="From name"><Input value={form.from_name} onChange={set('from_name')} placeholder="Your company" /></Field>
                </div>
                <div className="flex flex-wrap gap-5">
                    <Checkbox label="Use SSL/TLS (usually port 465)" checked={form.secure} onChange={e => setForm(f => ({ ...f, secure: e.target.checked }))} />
                    <Checkbox label="Set as default" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                </div>
            </form>
            <FormActions ready={ready} onTest={() => onTest({ host: form.host, port: parseInt(form.port, 10), secure: form.secure, username: form.username, password: form.password })} testing={testing} saving={saving} />
        </>
    );
}

function FormActions({ ready, onTest, testing, saving }) {
    return (
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
            <Button onClick={onTest} loading={testing} disabled={!ready}>Test connection</Button>
            <Button variant="primary" type="submit" form="smtp-form" loading={saving}>Save account</Button>
        </div>
    );
}

export default function SmtpAccounts() {
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const query = useQuery({ queryKey: ['nexmail-smtp'], queryFn: () => nmSmtpAPI.getAll().then(r => r.data || []), staleTime: 60 * 1000 });
    const accounts = query.data || [];
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['nexmail-smtp'] });

    const test = useMutation({
        mutationFn: cfg => nmSmtpAPI.test(cfg),
        onSuccess: r => toast.success(r.message || 'Connection works'),
        onError: err => toast.error(apiErr(err, 'Connection failed')),
    });
    const save = useMutation({
        mutationFn: payload => nmSmtpAPI.create(payload),
        onSuccess: () => { toast.success('SMTP account added'); setAdding(false); refresh(); },
        onError: err => toast.error(apiErr(err, 'Failed to add account')),
    });
    const remove = useMutation({
        mutationFn: acc => nmSmtpAPI.delete(acc.id),
        onSuccess: () => { toast.success('Account deleted'); setDeleting(null); refresh(); },
        onError: () => { toast.error('Failed to delete'); setDeleting(null); },
    });

    const addButton = <Button variant="primary" onClick={() => setAdding(true)}><FiPlus className="size-4" />Add account</Button>;
    let body;
    if (query.isLoading) body = <Skeleton className="h-32 rounded-md" />;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!accounts.length) body = <Panel><EmptyState title="No SMTP accounts" description="Add an SMTP account to start sending campaigns." action={addButton} /></Panel>;
    else {
        body = (
            <div className="space-y-3">
                {accounts.map(acc => {
                    const sent = acc.sent_today || 0;
                    const pct = Math.min((sent / (acc.daily_limit || 1)) * 100, 100);
                    return (
                        <Panel key={acc.id}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-fg">{acc.name}</h2>
                                        {!!acc.is_default && <Badge tone="info">Default</Badge>}
                                    </div>
                                    <p className="font-mono text-xs text-fg-muted">{acc.host}:{acc.port} · {acc.auth_user}</p>
                                    {acc.from_email && acc.from_email !== acc.auth_user && <p className="text-xs text-fg-subtle">Sends as {acc.from_email}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-28">
                                        <p className="text-right font-mono text-2xs tabular-nums text-fg-muted">{sent}/{acc.daily_limit} today</p>
                                        <div role="progressbar" aria-valuemin={0} aria-valuemax={acc.daily_limit} aria-valuenow={sent} aria-label={`${acc.name} daily usage`} className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                                            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    <Badge tone={acc.is_active ? 'success' : 'danger'}>{acc.is_active ? 'Active' : 'Inactive'}</Badge>
                                    <IconButton size="sm" variant="danger" label={`Delete ${acc.name}`} onClick={() => setDeleting(acc)}><FiTrash2 className="size-4" /></IconButton>
                                </div>
                            </div>
                            {acc.warmup_mode && <p className="mt-2 text-xs text-warning">Warmup mode: day {acc.warmup_day} ({acc.warmup_daily_limit}/day limit)</p>}
                            {acc.last_error && <p className="mt-2 text-xs text-danger">Last error: {acc.last_error}</p>}
                        </Panel>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-4">
            <PageHeader title="SMTP accounts" description="Email sending for NexMail campaigns" actions={addButton} />
            <p className="rounded-sm border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                <span className="font-medium text-fg">Zoho Mail:</span> choose the Zoho India preset for @zoho.in or Indian custom domains, use the full mailbox as the username, an app password if 2FA is on, and set From email to the address recipients should see.
            </p>
            {body}

            <Dialog open={adding} onClose={() => setAdding(false)} title="Add SMTP account" size="lg">
                {adding && <AccountForm onSave={p => save.mutate(p)} onTest={cfg => test.mutate(cfg)} testing={test.isPending} saving={save.isPending} />}
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting)}
                loading={remove.isPending}
                title="Delete SMTP account?"
                message={deleting && `This deletes ${deleting.name}. This can’t be undone.`}
                confirmText="Delete account"
            />
        </div>
    );
}
