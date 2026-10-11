import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/axios';
import { settingsAPI } from '../../api';
import {
    Avatar, Button, ErrorState, Field, Input, PageHeader, Panel, Select, Skeleton, Switch, Tabs, cx,
} from '../../components/ui';

const TABS = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'payments', label: 'Payments' },
    { id: 'smtp', label: 'Email / SMTP' },
    { id: 'ai', label: 'AI providers' },
];

const SMTP_PRESETS = [
    { name: 'Zoho India', host: 'smtp.zoho.in', port: '465', secure: true },
    { name: 'Zoho Global', host: 'smtp.zoho.com', port: '465', secure: true },
    { name: 'Gmail', host: 'smtp.gmail.com', port: '587', secure: false },
    { name: 'Outlook', host: 'smtp.office365.com', port: '587', secure: false },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', secure: false },
];

const AI_PROVIDERS = [
    { key: 'groq', name: 'Groq', desc: 'First in the fallback chain', placeholder: 'gsk_…' },
    { key: 'openai', name: 'OpenAI', desc: 'Second in the fallback chain', placeholder: 'sk-…' },
    { key: 'grok', name: 'xAI Grok', desc: 'Third in the fallback chain', placeholder: 'xai-…' },
    { key: 'gemini', name: 'Google Gemini', desc: 'Last in the fallback chain', placeholder: 'AIza…' },
];

const PLANS = ['starter', 'growth', 'business'];
const ALL_TIMEZONES = (() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC', 'Asia/Kolkata']; } })();
const browserTimezone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; } })();
// The API returns a stored secret as a mask ("sk-a...wxyz", "****" or "configured"), never the value
const SECRET_SENTINEL = '****';

const errMsg = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

/** Write-only secret field: blank keeps the stored value, typing replaces it. */
function SecretField({ label, stored, value, onChange, placeholder, className }) {
    return (
        <Field label={label} className={className} hint={stored ? `Saved (${stored === SECRET_SENTINEL || stored === 'configured' ? 'hidden' : stored}). Leave blank to keep it.` : 'Not set'}>
            <Input type="password" autoComplete="new-password" spellCheck={false} value={value} onChange={onChange} placeholder={placeholder} className="font-mono text-xs" />
        </Field>
    );
}

// Drop blank secret fields so saving never clears a stored secret
const withoutBlank = (obj, secretKeys) => Object.fromEntries(Object.entries(obj).filter(([k, v]) => !(secretKeys.includes(k) && !v)));

function useSaveSettings(successText) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: payload => settingsAPI.updateSettings(payload),
        onSuccess: () => { toast.success(successText); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
        onError: err => toast.error(errMsg(err, 'Could not save settings')),
    });
}

function Actions({ children }) {
    return <div className="flex flex-wrap justify-end gap-2 pt-2">{children}</div>;
}

function ProfileSection() {
    const { user, syncFromStorage } = useAuth();
    const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    // Used to show a success toast without saving anything (the API call was commented out)
    const save = useMutation({
        mutationFn: () => apiClient.put('/auth/profile', form).then(r => r.data),
        onSuccess: res => {
            try {
                const saved = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...saved, ...res.user }));
                syncFromStorage();
            } catch { /* header name refreshes on next login */ }
            toast.success('Profile updated');
        },
        onError: err => toast.error(errMsg(err, 'Failed to update profile')),
    });
    const name = `${form.firstName} ${form.lastName}`.trim();
    return (
        <Panel title="Profile" description="Your name and phone as teammates see them">
            <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                    <Avatar name={name || user?.email || ''} size="lg" />
                    <div className="min-w-0">
                        <p className="font-medium text-fg truncate">{name || 'No name set'}</p>
                        <p className="text-sm text-fg-muted truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="First name" required><Input required value={form.firstName} onChange={set('firstName')} /></Field>
                    <Field label="Last name" required><Input required value={form.lastName} onChange={set('lastName')} /></Field>
                </div>
                <Field label="Email" hint="Email is your login and can't be changed here"><Input value={user?.email || ''} disabled /></Field>
                <Field label="Phone"><Input type="tel" value={form.phone} onChange={set('phone')} /></Field>
                <Actions><Button variant="primary" type="submit" loading={save.isPending}>Save profile</Button></Actions>
            </form>
        </Panel>
    );
}

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

function SecuritySection() {
    const [form, setForm] = useState(EMPTY_PASSWORDS);
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const mismatch = form.confirmPassword && form.newPassword !== form.confirmPassword ? 'Passwords do not match' : undefined;
    // Same story as the profile: this used to toast success and change nothing
    const save = useMutation({
        mutationFn: () => apiClient.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword }),
        onSuccess: () => { toast.success('Password changed'); setForm(EMPTY_PASSWORDS); },
        onError: err => toast.error(errMsg(err, 'Failed to change password')),
    });
    return (
        <Panel title="Change password" description="Use a strong password you don't use anywhere else">
            <form onSubmit={e => { e.preventDefault(); if (!mismatch) save.mutate(); }} className="space-y-4 max-w-xl">
                <Field label="Current password" required>
                    <Input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={set('currentPassword')} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="New password" required hint="At least 8 characters">
                        <Input type="password" autoComplete="new-password" required minLength={8} value={form.newPassword} onChange={set('newPassword')} />
                    </Field>
                    <Field label="Confirm new password" required error={mismatch}>
                        <Input type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
                    </Field>
                </div>
                <Actions><Button variant="primary" type="submit" loading={save.isPending}>Change password</Button></Actions>
            </form>
        </Panel>
    );
}

function PreferencesSection({ settings }) {
    const current = settings.default_timezone || 'UTC';
    const save = useSaveSettings('Timezone updated');
    const zones = ALL_TIMEZONES.includes(current) ? ALL_TIMEZONES : [current, ...ALL_TIMEZONES];
    return (
        <Panel title="Default timezone" description="Used for scheduled tasks, reports, and as the default for new tenants">
            <div className="space-y-3 max-w-xl">
                <Field label="Timezone">
                    <Select value={current} disabled={save.isPending} onChange={e => save.mutate({ default_timezone: e.target.value })}>
                        {zones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                    </Select>
                </Field>
                {browserTimezone !== current && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm">
                        <span className="text-fg-muted">Your browser is on <span className="font-medium text-fg">{browserTimezone}</span></span>
                        <Button size="sm" onClick={() => save.mutate({ default_timezone: browserTimezone })} disabled={save.isPending}>Use this</Button>
                    </div>
                )}
            </div>
        </Panel>
    );
}

const PAYMENT_SECRETS = ['stripe_api_key', 'stripe_webhook_secret', 'razorpay_api_key', 'razorpay_secret_key', 'razorpay_webhook_secret'];
const PRICE_KEYS = PLANS.flatMap(p => [`stripe_price_id_${p}`, `stripe_price_id_${p}_yearly`]);

function PaymentsSection({ settings }) {
    const [form, setForm] = useState(() => ({
        pricing_page_mode: settings.pricing_page_mode || 'payment_link',
        contact_sales_email: settings.contact_sales_email || '',
        ...Object.fromEntries(PAYMENT_SECRETS.map(k => [k, ''])),
        ...Object.fromEntries(PRICE_KEYS.map(k => [k, settings[k] || ''])),
    }));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const save = useSaveSettings('Payment settings saved');
    const secret = (key, label, placeholder) => (
        <SecretField label={label} stored={settings[key]} value={form[key]} onChange={set(key)} placeholder={placeholder} />
    );
    return (
        <form onSubmit={e => { e.preventDefault(); save.mutate(withoutBlank(form, PAYMENT_SECRETS)); }} className="space-y-4">
            <Panel title="Pricing page mode" description="How visitors act on the pricing page">
                <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                    <legend className="sr-only">Pricing page mode</legend>
                    {[
                        ['payment_link', 'Stripe checkout', 'Buy buttons that open Stripe payment links'],
                        ['contact_us', 'Contact us', 'Contact buttons that collect a lead'],
                    ].map(([value, title, desc]) => (
                        <button key={value} type="button" aria-pressed={form.pricing_page_mode === value}
                            onClick={() => setForm(f => ({ ...f, pricing_page_mode: value }))}
                            className={cx('rounded-sm border p-3 text-left transition-colors', form.pricing_page_mode === value ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-2')}>
                            <span className="block text-sm font-medium text-fg">{title}</span>
                            <span className="block mt-0.5 text-xs text-fg-muted">{desc}</span>
                        </button>
                    ))}
                </fieldset>
                <Field label="Sales inquiry email" hint="Used in contact-us mode" className="mt-4 max-w-md">
                    <Input type="email" value={form.contact_sales_email} onChange={set('contact_sales_email')} placeholder="sales@napnix.in" />
                </Field>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Stripe" description="API key and webhook secret">
                    <div className="space-y-4">
                        {secret('stripe_api_key', 'Secret key', 'sk_live_…')}
                        {secret('stripe_webhook_secret', 'Webhook secret', 'whsec_…')}
                    </div>
                </Panel>
                <Panel title="Razorpay" description="API keys and webhook secret">
                    <div className="space-y-4">
                        {secret('razorpay_api_key', 'Key ID', 'rzp_live_…')}
                        {secret('razorpay_secret_key', 'Key secret')}
                        {secret('razorpay_webhook_secret', 'Webhook secret')}
                    </div>
                </Panel>
            </div>

            <Panel title="Stripe price IDs" description="The Stripe price for each plan and billing cycle">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PLANS.map(plan => (
                        <fieldset key={plan} className="space-y-3 rounded-sm border border-border p-3">
                            <legend className="px-1 text-sm font-medium capitalize text-fg">{plan}</legend>
                            <Field label="Monthly"><Input value={form[`stripe_price_id_${plan}`]} onChange={set(`stripe_price_id_${plan}`)} placeholder="price_…" className="font-mono text-xs" /></Field>
                            <Field label="Yearly"><Input value={form[`stripe_price_id_${plan}_yearly`]} onChange={set(`stripe_price_id_${plan}_yearly`)} placeholder="price_…" className="font-mono text-xs" /></Field>
                        </fieldset>
                    ))}
                </div>
            </Panel>
            <Actions><Button variant="primary" type="submit" loading={save.isPending}>Save payment settings</Button></Actions>
        </form>
    );
}

function SmtpSection({ settings }) {
    const [form, setForm] = useState(() => ({
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || '465',
        smtp_secure: settings.smtp_secure === 'true' || settings.smtp_secure === true,
        smtp_user: settings.smtp_user || '',
        smtp_password: '',
        smtp_from_email: settings.smtp_from_email || '',
        smtp_from_name: settings.smtp_from_name || '',
    }));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const save = useSaveSettings('SMTP settings saved');
    const hasPassword = !!form.smtp_password || !!settings.smtp_password;
    const test = useMutation({
        mutationFn: () => settingsAPI.testSmtp({
            host: form.smtp_host,
            port: parseInt(form.smtp_port, 10) || 587,
            secure: form.smtp_secure,
            username: form.smtp_user,
            password: form.smtp_password || SECRET_SENTINEL, // sentinel: server tests the saved password
        }),
        onSuccess: res => (res.success ? toast.success(res.message || 'SMTP connection works') : toast.error(res.error || 'Connection failed')),
        onError: err => toast.error(errMsg(err, 'Test failed')),
    });
    const canTest = form.smtp_host && form.smtp_user && hasPassword;

    return (
        <Panel title="Outgoing mail (SMTP)" description="System email: invites, notifications, agreements">
            <form onSubmit={e => { e.preventDefault(); save.mutate(withoutBlank({ ...form, smtp_secure: String(form.smtp_secure) }, ['smtp_password'])); }} className="space-y-4 max-w-2xl">
                <div>
                    <p className="mb-1.5 text-sm font-medium text-fg">Presets</p>
                    <div className="flex flex-wrap gap-1.5">
                        {SMTP_PRESETS.map(p => (
                            <Button key={p.name} size="sm" variant="secondary"
                                onClick={() => setForm(f => ({ ...f, smtp_host: p.host, smtp_port: p.port, smtp_secure: p.secure }))}>
                                {p.name}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="SMTP host" className="sm:col-span-2"><Input value={form.smtp_host} onChange={set('smtp_host')} placeholder="smtp.zoho.in" className="font-mono" /></Field>
                    <Field label="Port"><Input type="number" min="1" max="65535" value={form.smtp_port} onChange={set('smtp_port')} className="font-mono" /></Field>
                </div>
                <Switch checked={form.smtp_secure} onChange={v => setForm(f => ({ ...f, smtp_secure: v }))} label="Use SSL/TLS (usually port 465)" />
                <Field label="Username" hint="Usually the full mailbox address"><Input value={form.smtp_user} onChange={set('smtp_user')} placeholder="noreply@yourdomain.com" /></Field>
                <SecretField label="Password / app password" stored={settings.smtp_password} value={form.smtp_password} onChange={set('smtp_password')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="From email" hint="The sender address people see"><Input type="email" value={form.smtp_from_email} onChange={set('smtp_from_email')} /></Field>
                    <Field label="From name"><Input value={form.smtp_from_name} onChange={set('smtp_from_name')} placeholder="Napnix" /></Field>
                </div>
                <p className="text-xs text-fg-muted">Zoho: pick Zoho India for @zoho.in or Indian custom domains, and use an app password if 2FA is on.</p>
                <Actions>
                    <Button onClick={() => test.mutate()} loading={test.isPending} disabled={!canTest}>Test connection</Button>
                    <Button variant="primary" type="submit" loading={save.isPending}>Save SMTP settings</Button>
                </Actions>
            </form>
        </Panel>
    );
}

const AI_KEYS = AI_PROVIDERS.map(p => `${p.key}_api_key`);

function AiSection({ settings }) {
    const [form, setForm] = useState(() => Object.fromEntries(AI_KEYS.map(k => [k, ''])));
    const save = useSaveSettings('AI keys saved');
    const test = useMutation({
        mutationFn: provider => settingsAPI.testAI(provider, form[`${provider}_api_key`] || SECRET_SENTINEL),
        onSuccess: (res, provider) => (res.success
            ? toast.success(res.message || 'Connection works')
            : toast.error(res.error || `${AI_PROVIDERS.find(p => p.key === provider)?.name} connection failed`)),
        onError: err => toast.error(errMsg(err, 'Test failed')),
    });
    const blank = AI_KEYS.every(k => !form[k]);
    return (
        <form onSubmit={e => { e.preventDefault(); save.mutate(withoutBlank(form, AI_KEYS)); }} className="space-y-4">
            <Panel title="AI providers" description="The AI service tries providers in this order and falls back on rate limits or outages">
                <ul className="divide-y divide-border">
                    {AI_PROVIDERS.map(p => {
                        const key = `${p.key}_api_key`;
                        const canTest = !!form[key] || !!settings[key];
                        return (
                            <li key={p.key} className="grid grid-cols-1 md:grid-cols-[12rem_1fr_auto] items-start gap-3 py-4 first:pt-0 last:pb-0">
                                <div>
                                    <p className="text-sm font-medium text-fg">{p.name}</p>
                                    <p className="text-xs text-fg-subtle">{p.desc}</p>
                                </div>
                                <SecretField label={`${p.name} API key`} stored={settings[key]} value={form[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={p.placeholder} />
                                <Button className="md:mt-6" onClick={() => test.mutate(p.key)} disabled={!canTest}
                                    loading={test.isPending && test.variables === p.key}>
                                    Test
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </Panel>
            <Actions><Button variant="primary" type="submit" loading={save.isPending} disabled={blank}>Save AI keys</Button></Actions>
        </form>
    );
}

export default function Settings() {
    const [params, setParams] = useSearchParams();
    const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'profile';
    const query = useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsAPI.getSettings().then(r => r.data || {}),
        staleTime: 2 * 60 * 1000,
    });
    const needsSettings = !['profile', 'security'].includes(tab);

    let body;
    if (tab === 'profile') body = <ProfileSection />;
    else if (tab === 'security') body = <SecuritySection />;
    else if (query.isLoading) body = <Skeleton className="h-72 rounded-md" />;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else {
        // Remount on fresh data so the forms pick up what was just saved
        const Section = { preferences: PreferencesSection, payments: PaymentsSection, smtp: SmtpSection, ai: AiSection }[tab];
        body = <Section key={`${tab}-${query.dataUpdatedAt}`} settings={query.data} />;
    }

    return (
        <div className="max-w-5xl space-y-4">
            <PageHeader title="Settings" description="Your account and system configuration" />
            <Tabs label="Settings sections" tabs={TABS} value={tab} onChange={id => setParams({ tab: id }, { replace: true })} />
            <div role="tabpanel" aria-labelledby={`tab-${tab}`} aria-busy={needsSettings && query.isFetching}>{body}</div>
        </div>
    );
}
