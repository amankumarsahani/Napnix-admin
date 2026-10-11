import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiCopy, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { nmDomainsAPI } from '../../api/nexmail';
import {
    Badge, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel, Skeleton,
} from '../../components/ui';

// This page used to be a mock: Add, Re-verify and Remove only showed success toasts and changed nothing.
// It now talks to the real sending-identity API (SES Easy DKIM + custom MAIL FROM).
const STATUS_TONE = { verified: 'success', pending: 'warning', failed: 'danger' };
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;

function CopyCell({ value }) {
    return (
        <span className="inline-flex max-w-full items-center gap-1">
            <code className="truncate font-mono text-xs text-fg">{value}</code>
            <IconButton size="sm" label={`Copy ${value}`} onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied'); }}><FiCopy className="size-3.5" /></IconButton>
        </span>
    );
}

function DnsRecords({ records }) {
    if (!records?.length) return <p className="text-sm text-fg-subtle">No DNS records on file. Remove and re-add the domain to generate them.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <caption className="sr-only">DNS records to publish</caption>
                <thead>
                    <tr className="border-b border-border text-left text-xs text-fg-muted">
                        <th scope="col" className="py-1.5 pr-3 font-medium">Purpose</th>
                        <th scope="col" className="py-1.5 pr-3 font-medium">Type</th>
                        <th scope="col" className="py-1.5 pr-3 font-medium">Host</th>
                        <th scope="col" className="py-1.5 font-medium">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {records.map(r => (
                        <tr key={`${r.key || r.purpose}-${r.host}`}>
                            <td className="py-2 pr-3 text-fg-muted">{r.purpose}{r.required === false && <span className="ml-1 text-2xs text-fg-subtle">(optional)</span>}</td>
                            <td className="py-2 pr-3 font-mono text-xs">{r.type}</td>
                            <td className="max-w-56 py-2 pr-3"><CopyCell value={r.host} /></td>
                            <td className="max-w-72 py-2"><CopyCell value={r.value} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="mt-2 text-xs text-fg-subtle">CNAME records must be DNS-only (not proxied). DKIM can take a few minutes up to 72 hours to verify.</p>
        </div>
    );
}

function DomainCard({ d, onVerify, verifying, onRemove }) {
    return (
        <Panel
            title={d.domain}
            description={d.last_checked_at ? `Last checked ${new Date(d.last_checked_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : undefined}
            actions={
                <span className="flex items-center gap-2">
                    <Badge tone={d.verified_for_sending ? 'success' : STATUS_TONE[d.status] || 'warning'} className="capitalize">
                        {d.verified_for_sending ? 'Verified for sending' : d.status}
                    </Badge>
                    <Button size="sm" onClick={() => onVerify(d)} loading={verifying}><FiRefreshCw className="size-4" />Verify</Button>
                    <IconButton size="sm" variant="danger" label={`Remove ${d.domain}`} onClick={() => onRemove(d)}><FiTrash2 className="size-4" /></IconButton>
                </span>
            }
        >
            <div className="space-y-3">
                <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {[['DKIM', d.dkim_status], ['MAIL FROM', d.mail_from_status]].map(([label, status]) => (
                        <li key={label} className="flex items-center gap-1.5 text-fg-muted">
                            <FiCheckCircle aria-hidden="true" className={status === 'verified' || status === 'success' ? 'size-4 text-success' : 'size-4 text-fg-subtle'} />
                            {label}: <span className="capitalize text-fg">{status || 'pending'}</span>
                        </li>
                    ))}
                </ul>
                {d.last_error && <p role="alert" className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{d.last_error}</p>}
                {!d.verified_for_sending && <DnsRecords records={d.dns_records} />}
            </div>
        </Panel>
    );
}

export default function Domains() {
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [removing, setRemoving] = useState(null);

    const query = useQuery({ queryKey: ['nexmail-domains'], queryFn: () => nmDomainsAPI.getAll(), staleTime: 60 * 1000 });
    const domains = query.data?.data || [];
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['nexmail-domains'] });

    const add = useMutation({
        mutationFn: domain => nmDomainsAPI.create({ domain }),
        onSuccess: r => { toast.success(r.message || 'Domain added. Publish the DNS records, then verify.', { duration: 6000 }); setAdding(false); setNewDomain(''); refresh(); },
        onError: err => toast.error(apiErr(err, 'Failed to add domain')),
    });
    const verify = useMutation({
        mutationFn: d => nmDomainsAPI.verify(d.id),
        onSuccess: r => { (r.data?.verified_for_sending ? toast.success : toast)(r.message || 'Checked'); refresh(); },
        onError: err => toast.error(apiErr(err, 'Verification failed')),
    });
    const remove = useMutation({
        mutationFn: d => nmDomainsAPI.delete(d.id),
        onSuccess: () => { toast.success('Domain removed'); setRemoving(null); refresh(); },
        onError: err => { toast.error(apiErr(err, 'Failed to remove domain')); setRemoving(null); },
    });

    const addButton = <Button variant="primary" onClick={() => setAdding(true)}><FiPlus className="size-4" />Add domain</Button>;
    let body;
    if (query.isLoading) body = <Skeleton className="h-40 rounded-md" />;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!domains.length) {
        body = <Panel><EmptyState title="No sending domains" description="Add your domain to publish SPF/DKIM/DMARC records and send from your own address." action={addButton} /></Panel>;
    } else {
        body = <div className="space-y-4">{domains.map(d => <DomainCard key={d.id} d={d} onVerify={verify.mutate} verifying={verify.isPending && verify.variables?.id === d.id} onRemove={setRemoving} />)}</div>;
    }

    return (
        <div className="max-w-5xl space-y-4">
            <PageHeader title="Sending domains" description="Verify a domain for better deliverability (DKIM, MAIL FROM, DMARC)" actions={addButton} />
            {body}

            <Dialog
                open={adding}
                onClose={() => setAdding(false)}
                title="Add sending domain"
                size="sm"
                footer={
                    <>
                        <Button onClick={() => setAdding(false)} disabled={add.isPending}>Cancel</Button>
                        <Button variant="primary" type="submit" form="domain-add-form" loading={add.isPending}>Add domain</Button>
                    </>
                }
            >
                <form id="domain-add-form" onSubmit={e => { e.preventDefault(); add.mutate(newDomain.trim().toLowerCase()); }} className="space-y-3">
                    <Field label="Domain" required hint="After adding, you publish the DNS records shown for it, then press Verify">
                        <Input required value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="yourdomain.com" className="font-mono" data-autofocus />
                    </Field>
                </form>
            </Dialog>

            <ConfirmDialog
                open={!!removing}
                onClose={() => setRemoving(null)}
                onConfirm={() => remove.mutate(removing)}
                loading={remove.isPending}
                title="Remove domain?"
                message={removing && `${removing.domain} stops being a verified sending identity, so you can no longer send from it. This can’t be undone.`}
                confirmText="Remove domain"
            />
        </div>
    );
}
