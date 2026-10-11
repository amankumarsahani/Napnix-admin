import { useState } from 'react';
import { Button, Checkbox, Dialog, Field, Input } from '../../../components/ui';
import { BASE_DOMAIN } from './helpers';

function DomainForm({ tenant, onSubmit }) {
    const [crm, setCrm] = useState(tenant.custom_domain_crm || '');
    const [storefront, setStorefront] = useState(tenant.custom_domain_storefront || '');
    return (
        <form id="domain-form" onSubmit={e => { e.preventDefault(); onSubmit({ crm: crm.trim(), storefront: storefront.trim() }); }} className="space-y-4">
            <p className="text-sm text-fg-muted">
                Point the tenant&apos;s own domains at Cloudflare Pages. The API always stays on <code className="rounded-sm bg-surface-3 px-1 text-xs">{tenant.slug}-crm-api.{BASE_DOMAIN}</code>.
            </p>
            <Field label="CRM dashboard" hint="CNAME target: nexcrm-frontend.pages.dev">
                <Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="crm.yourbrand.com" className="font-mono" data-autofocus />
            </Field>
            <Field label="Storefront" hint="CNAME target: nexcrm-storefront.pages.dev">
                <Input value={storefront} onChange={e => setStorefront(e.target.value)} placeholder="yourbrand.com or store.yourbrand.com" className="font-mono" />
            </Field>
            <details className="rounded-sm border border-border text-sm">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium text-fg">How to set up a custom domain</summary>
                <ol className="list-decimal space-y-2 px-8 py-3 text-fg-muted">
                    <li>Enter one or both domains above and save. They are registered with Cloudflare Pages.</li>
                    <li>The tenant adds CNAME records at their DNS provider: the CRM domain to <code className="font-mono text-xs">nexcrm-frontend.pages.dev</code>, the storefront domain to <code className="font-mono text-xs">nexcrm-storefront.pages.dev</code>. Any provider works.</li>
                    <li>Wait for DNS to propagate (usually minutes). SSL is automatic.</li>
                    <li>The storefront then detects the domain and loads the right tenant.</li>
                </ol>
            </details>
        </form>
    );
}

export function DomainDialog({ tenant, open, onClose, onSubmit, saving }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Configure custom domains"
            footer={
                <>
                    <Button onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button variant="primary" type="submit" form="domain-form" loading={saving}>Save domains</Button>
                </>
            }
        >
            {open && <DomainForm tenant={tenant} onSubmit={onSubmit} />}
        </Dialog>
    );
}

function DeleteContent({ tenant, onClose, onSubmit, deleting }) {
    const [typed, setTyped] = useState('');
    const [dropDatabase, setDropDatabase] = useState(false);
    return (
        <Dialog
            open
            onClose={onClose}
            dismissible={!deleting}
            size="sm"
            title="Delete tenant permanently?"
            footer={
                <>
                    <Button onClick={onClose} disabled={deleting}>Cancel</Button>
                    <Button variant="danger" onClick={() => onSubmit({ dropDatabase })} loading={deleting} disabled={typed !== tenant.slug}>Delete permanently</Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-fg-muted">This permanently deletes <strong className="text-fg">{tenant.name}</strong>. It can&apos;t be undone.</p>
                <Field label={<>Type <span className="font-mono">{tenant.slug}</span> to confirm</>}>
                    <Input value={typed} onChange={e => setTyped(e.target.value)} placeholder={tenant.slug} className="font-mono" data-autofocus />
                </Field>
                <Checkbox label={<>Also drop the database <span className="font-mono">({tenant.db_name})</span></>} checked={dropDatabase} onChange={e => setDropDatabase(e.target.checked)} />
            </div>
        </Dialog>
    );
}

// Mounted only while open, so the typed confirmation never survives a cancel
export function DeleteDialog({ tenant, open, ...rest }) {
    return open ? <DeleteContent tenant={tenant} {...rest} /> : null;
}
