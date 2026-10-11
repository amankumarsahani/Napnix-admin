import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDatabase, FiMail } from 'react-icons/fi';
import { plansAPI, tenantsAPI } from '../../api';
import serverService from '../../api/admin';
import { Button, Dialog, Field, Input, Select, cx } from '../../components/ui';

const PRODUCTS = [
    { slug: 'nexcrm', name: 'NapCRM', desc: 'Full CRM with contacts, deals, tasks, storefront', icon: FiDatabase },
    { slug: 'napmail', name: 'NapMail', desc: 'Email marketing campaigns & automation', icon: FiMail },
];

const INDUSTRIES = [
    ['general', 'General CRM'], ['ecommerce', 'E-Commerce'], ['education', 'Education (coaching / training)'],
    ['school', 'School / College (full ERP)'], ['fitness', 'Fitness / Gym'], ['healthcare', 'Healthcare'],
    ['hospitality', 'Hospitality'], ['legal', 'Legal'], ['logistics', 'Logistics'], ['manufacturing', 'Manufacturing'],
    ['realestate', 'Real Estate'], ['restaurant', 'Restaurant'], ['salon', 'Salon & Spa'], ['hrm', 'HR Management'],
    ['services', 'Services'], ['travel', 'Travel'], ['car_rental', 'Car Rental'], ['boat_rental', 'Boat Rental'],
];

const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function CreateTenantDialog({ open, onClose, onCreated }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Create new tenant"
            size="lg"
            footer={
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit" form="create-tenant-form">Create & Provision</Button>
                </>
            }
        >
            {open && <CreateTenantForm onCreated={onCreated} />}
        </Dialog>
    );
}

function CreateTenantForm({ onCreated }) {
    const domain = import.meta.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
    const [products, setProducts] = useState(['nexcrm']);
    const [slugTouched, setSlugTouched] = useState(false);
    const [form, setForm] = useState({
        name: '', slug: '', email: '', phone: '', industry_type: 'general', academic_mode: 'school',
        plan_id: '', server_id: '', custom_domain: '',
    });
    const crm = products.includes('nexcrm');

    const plansQuery = useQuery({
        queryKey: ['plans'],
        queryFn: async () => { const r = await plansAPI.getAll(); return r.success ? r.data : []; },
        staleTime: 10 * 60 * 1000,
    });
    const serversQuery = useQuery({
        queryKey: ['servers'],
        queryFn: async () => { const r = await serverService.getAllServers(); return r.success ? r.data : []; },
        staleTime: 2 * 60 * 1000,
    });

    // Default to the least-loaded server until the user picks one
    const servers = serversQuery.data || [];
    const leastLoaded = servers.length ? servers.reduce((a, b) => (a.tenant_count <= b.tenant_count ? a : b)) : null;
    const serverId = form.server_id || leastLoaded?.id || '';

    const create = useMutation({
        mutationFn: () => tenantsAPI.create({ ...form, server_id: serverId, tools: products }),
        onSuccess: res => { toast.success('Tenant created. Provisioning is now running.'); onCreated(res.data?.tenantId); },
        onError: err => toast.error(err.response?.data?.error || 'Failed to create tenant'),
    });

    const set = key => e => setForm(f => ({
        ...f,
        [key]: e.target.value,
        ...(key === 'name' && !slugTouched ? { slug: slugify(e.target.value) } : {}),
    }));
    const toggle = slug => setProducts(prev => (prev.includes(slug) ? (prev.length > 1 ? prev.filter(p => p !== slug) : prev) : [...prev, slug]));

    return (
        <form id="create-tenant-form" onSubmit={e => { e.preventDefault(); if (!create.isPending) create.mutate(); }} className="space-y-4">
            <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-fg">Products <span className="text-danger" aria-hidden="true">*</span></legend>
                <div className="grid grid-cols-2 gap-2">
                    {PRODUCTS.map(p => {
                        const on = products.includes(p.slug);
                        const Icon = p.icon;
                        return (
                            <button key={p.slug} type="button" aria-pressed={on} onClick={() => toggle(p.slug)}
                                className={cx('relative flex flex-col items-start gap-1 rounded-sm border p-3 text-left',
                                    on ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong')}>
                                {on && <FiCheckCircle aria-hidden="true" className="absolute top-2.5 right-2.5 size-4 text-accent" />}
                                <Icon aria-hidden="true" className={cx('size-5', on ? 'text-accent' : 'text-fg-subtle')} />
                                <span className="text-sm font-medium text-fg">{p.name}</span>
                                <span className="text-xs text-fg-muted leading-snug">{p.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <p className="rounded-sm border border-accent/25 bg-accent-soft px-3 py-2 text-sm text-fg">
                New tenants are created automatically as a 14-day trial with the selected plan. You can adjust the trial, activate access, send a payment link, or mark them paid from the tenant detail page after creation.
            </p>

            <Field label="Company name" required>
                <Input value={form.name} onChange={set('name')} placeholder="Acme Corporation" data-autofocus />
            </Field>

            <Field label="Subdomain (slug)" required hint={`${form.slug || 'your-slug'}-crm-api.${domain}`}>
                <Input value={form.slug} onChange={e => { setSlugTouched(true); set('slug')(e); }} pattern="[a-z0-9-]+" placeholder="acme-corp" className="font-mono" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Admin email" required>
                    <Input type="email" value={form.email} onChange={set('email')} placeholder="admin@acme.com" />
                </Field>
                <Field label="Phone">
                    <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
                </Field>
                {crm && (
                    <Field label="Industry">
                        <Select value={form.industry_type} onChange={set('industry_type')}>
                            {INDUSTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </Field>
                )}
                {crm && form.industry_type === 'school' && (
                    <Field label="Academic mode" hint="Same schema either way. College turns on credits, SGPA/CGPA and the backlog register.">
                        <Select value={form.academic_mode} onChange={set('academic_mode')}>
                            <option value="school">School (K-12) — classes, terms, report cards</option>
                            <option value="college">College — semesters, credits, SGPA/CGPA, backlogs</option>
                        </Select>
                    </Field>
                )}
                <Field label="Plan" required error={plansQuery.isError ? 'Could not load plans' : undefined}>
                    <Select value={form.plan_id} onChange={set('plan_id')} disabled={plansQuery.isLoading}>
                        <option value="">{plansQuery.isLoading ? 'Loading plans…' : 'Select plan'}</option>
                        {(plansQuery.data || []).map(plan => <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price_monthly}/mo</option>)}
                    </Select>
                </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                {crm && (
                    <Field label="Destination server" required={crm} error={serversQuery.isError ? 'Could not load servers' : undefined}>
                        <Select value={serverId} onChange={set('server_id')} disabled={serversQuery.isLoading}>
                            <option value="">{serversQuery.isLoading ? 'Loading servers…' : 'Select server'}</option>
                            {servers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.tenant_count} tenants)</option>)}
                        </Select>
                    </Field>
                )}
                <Field label="Custom domain" hint="Optional">
                    <Input value={form.custom_domain} onChange={set('custom_domain')} placeholder="crm.company.com" />
                </Field>
            </div>

            {create.isPending && <p role="status" className="text-sm text-fg-muted">Creating tenant…</p>}
        </form>
    );
}
