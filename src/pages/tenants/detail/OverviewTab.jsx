import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCopy, FiExternalLink, FiEye, FiEyeOff, FiGlobe, FiSettings, FiTrash2 } from 'react-icons/fi';
import { Badge, Button, IconButton, Panel, StatCard } from '../../../components/ui';
import { BASE_DOMAIN, isInfraReady } from './helpers';

function CopyRow({ label, value, secret }) {
    const [shown, setShown] = useState(false);
    const copy = () => { navigator.clipboard.writeText(value); toast.success('Copied'); };
    return (
        <div>
            <p className="mb-1 text-xs font-medium text-fg-muted">{label}</p>
            <div className="flex items-center justify-between gap-2 rounded-sm border border-border bg-surface-2 px-3 py-2">
                <span className="min-w-0 truncate font-mono text-sm text-fg">{secret && !shown ? '••••••••••••' : value}</span>
                <span className="flex shrink-0 gap-0.5">
                    {secret && (
                        <IconButton size="sm" label={shown ? `Hide ${label}` : `Show ${label}`} onClick={() => setShown(s => !s)}>
                            {shown ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
                        </IconButton>
                    )}
                    <IconButton size="sm" label={`Copy ${label}`} onClick={copy}><FiCopy className="size-4" /></IconButton>
                </span>
            </div>
        </div>
    );
}

function DomainRow({ title, host, status, href, ready }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-border p-3">
            <div className="flex min-w-0 items-center gap-3">
                <FiGlobe aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
                <div className="min-w-0">
                    <p className="text-xs text-fg-muted">{title}</p>
                    <p className="truncate text-sm font-medium text-fg">{host}</p>
                    <div className="mt-0.5">{status}</div>
                </div>
            </div>
            {ready ? (
                <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${title}`} className="rounded-sm p-2 text-fg-subtle hover:bg-surface-2 hover:text-fg">
                    <FiExternalLink className="size-4" />
                </a>
            ) : <span className="p-2 text-fg-subtle opacity-40"><FiExternalLink className="size-4" /></span>}
        </div>
    );
}

export default function OverviewTab({ tenant, onConfigureDomains, onRepairDns, repairing, onRunMigration, migrating, onDelete }) {
    const ready = isInfraReady(tenant);
    const crmHost = tenant.custom_domain_crm || `${tenant.slug}-crm.${BASE_DOMAIN}`;
    const storeHost = tenant.custom_domain_storefront || `${tenant.slug}.${BASE_DOMAIN}`;
    const customStatus = custom => (custom
        ? <Badge tone={tenant.custom_domain_verified ? 'success' : 'warning'}>{tenant.custom_domain_verified ? 'Verified' : 'Pending DNS'}</Badge>
        : <span className="text-2xs text-fg-subtle">{ready ? 'Default' : 'Not provisioned'}</span>);
    const lockedHint = ready ? undefined : 'Finish tenant provisioning first';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Port" value={tenant.assigned_port || '—'} />
                <StatCard label="Server" value={<span className="text-base">{tenant.server_name || 'Primary'}</span>} />
                <StatCard label="Industry" value={<span className="text-base capitalize">{tenant.industry_type || 'general'}</span>} />
                <StatCard label="Plan" value={<span className="text-base">{tenant.plan_name || 'Unassigned'}</span>} />
            </div>

            <Panel
                title="Domains"
                actions={
                    <span className="flex gap-2">
                        <Button size="sm" onClick={onRepairDns} disabled={!ready} loading={repairing} title={lockedHint || 'Re-attach Pages custom domains'}>Repair DNS</Button>
                        <Button size="sm" onClick={onConfigureDomains} disabled={!ready} title={lockedHint}><FiSettings className="size-4" />Configure</Button>
                    </span>
                }
            >
                <div className="grid gap-3 md:grid-cols-3">
                    <DomainRow title="CRM dashboard" host={crmHost} ready={ready} href={`https://${crmHost}`} status={customStatus(tenant.custom_domain_crm)} />
                    <DomainRow title="API" host={`${tenant.slug}-crm-api.${BASE_DOMAIN}`} ready={ready} href={`https://${tenant.slug}-crm-api.${BASE_DOMAIN}`}
                        status={<span className="text-2xs text-fg-subtle">{ready ? 'Managed by Napnix' : 'Not provisioned'}</span>} />
                    <DomainRow title="Storefront" host={storeHost} ready={ready} href={`https://${storeHost}`} status={customStatus(tenant.custom_domain_storefront)} />
                </div>
            </Panel>

            <Panel
                title="Infrastructure"
                actions={<Button size="sm" onClick={onRunMigration} loading={migrating} title="Create any missing industry tables">Run migration</Button>}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <CopyRow label="Database" value={tenant.db_name || '—'} />
                    <CopyRow label="Admin email" value={tenant.email || `admin@${tenant.slug}.local`} />
                    {tenant.admin_password && (
                        <div className="md:col-span-2">
                            <CopyRow label="Initial admin password" value={tenant.admin_password} secret />
                            <p className="mt-1 text-xs text-fg-subtle">For the tenant&apos;s first login. Hidden until you reveal it.</p>
                        </div>
                    )}
                </div>
            </Panel>

            <Panel title="Danger zone" description="Permanently deletes this tenant and its data. This can’t be undone." className="border-danger/40">
                <Button variant="danger" onClick={onDelete}><FiTrash2 className="size-4" />Delete tenant</Button>
            </Panel>
        </div>
    );
}
