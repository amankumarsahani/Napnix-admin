import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiCheck } from 'react-icons/fi';
import { plansAPI, settingsAPI } from '../../api';
import { Badge, EmptyState, ErrorState, PageHeader, Panel, Skeleton, Tabs } from '../../components/ui';

// This page used to show hard-coded USD prices ($49, $199), invented feature lists and a "30-day money back
// guarantee", none of which exist. It now shows the real plans from the database (INR), read-only.
const inr = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const featureList = f => {
    let obj = f;
    if (typeof f === 'string') { try { obj = JSON.parse(f); } catch { obj = {}; } }
    return Object.entries(obj || {}).map(([k, v]) => ({ key: k, label: k.replace(/_/g, ' '), value: v }));
};
const lim = n => (n == null || Number(n) >= 100000 ? 'Unlimited' : Number(n).toLocaleString('en-IN'));

export default function PricingPage() {
    const [cycle, setCycle] = useState('monthly');
    const plans = useQuery({ queryKey: ['plans'], queryFn: () => plansAPI.getAll().then(r => r.data || []), staleTime: 5 * 60 * 1000 });
    const settings = useQuery({ queryKey: ['settings'], queryFn: () => settingsAPI.getSettings().then(r => r.data || {}), staleTime: 2 * 60 * 1000 });
    const mode = settings.data?.pricing_page_mode;

    let body;
    if (plans.isLoading) body = <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-md" />)}</div>;
    else if (plans.isError) body = <ErrorState error={plans.error} onRetry={plans.refetch} />;
    else if (!plans.data.length) body = <Panel><EmptyState title="No plans configured" /></Panel>;
    else {
        body = (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans.data.filter(p => p.is_active !== 0 && p.is_active !== false).map(plan => {
                    const price = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                    return (
                        <Panel key={plan.id} title={plan.name} description={plan.description}>
                            <p className="mb-4">
                                <span className="font-mono text-3xl font-semibold tabular-nums text-fg">{inr(price)}</span>
                                <span className="ml-1 text-sm text-fg-muted">/{cycle === 'monthly' ? 'month' : 'year'}</span>
                            </p>
                            <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                {[['Users', plan.max_users], ['Leads', plan.max_leads], ['Clients', plan.max_clients], ['Projects', plan.max_projects]].map(([k, v]) => (
                                    <div key={k} className="flex justify-between"><dt className="text-fg-muted">{k}</dt><dd className="font-mono tabular-nums text-fg">{lim(v)}</dd></div>
                                ))}
                            </dl>
                            <ul className="space-y-1.5">
                                {featureList(plan.features).map(f => (
                                    <li key={f.key} className="flex items-start gap-2 text-sm text-fg-muted">
                                        <FiCheck aria-hidden="true" className={f.value === false ? 'mt-0.5 size-4 shrink-0 text-fg-subtle' : 'mt-0.5 size-4 shrink-0 text-success'} />
                                        <span className={f.value === false ? 'line-through' : undefined}>
                                            <span className="capitalize">{f.label}</span>{typeof f.value === 'number' ? `: ${f.value.toLocaleString('en-IN')}` : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="max-w-6xl space-y-4">
            <PageHeader
                title="Plans and pricing"
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <span>The plans customers can buy, read from the database. Checkout behaviour is set in</span>
                        <Link to="/settings?tab=payments" className="text-accent hover:underline">Settings, Payments</Link>
                        {mode && <Badge tone="info">{mode === 'payment_link' ? 'Pricing page: Stripe checkout' : 'Pricing page: contact us'}</Badge>}
                    </span>
                }
            />
            <Tabs label="Billing cycle" value={cycle} onChange={setCycle} tabs={[{ id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly' }]} />
            {body}
        </div>
    );
}
