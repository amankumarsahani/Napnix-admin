import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billingAPI, plansAPI, tenantsAPI } from '../../../api';
import {
    Badge, Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Panel, Select, Skeleton, StatCard,
} from '../../../components/ui';
import { apiError, daysUntil, fmtDate, inr, monthValue } from './helpers';

const PAYMENT_TONE = { success: 'success', succeeded: 'success', failed: 'danger' };

function BillingForm({ tenant, plans, subscription }) {
    const qc = useQueryClient();
    const [form, setForm] = useState(() => ({
        plan_id: tenant.plan_id ? String(tenant.plan_id) : '',
        status: tenant.status || 'trial',
        trial_ends_at: tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toISOString().split('T')[0] : '',
        billing_cycle: subscription?.billing_cycle || 'monthly',
        amount: '',
        follow_up_action: 'none',
    }));
    const [invoice, setInvoice] = useState({ billing_month: monthValue(), due_date: '' });
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    const plan = plans.find(p => String(p.id) === form.plan_id);
    const suggested = plan ? Number(form.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly) : 0;
    const effective = form.amount || (suggested ? String(suggested) : '');

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['tenant', String(tenant.id)] });
        qc.invalidateQueries({ queryKey: ['tenants'] });
        qc.invalidateQueries({ queryKey: ['tenant-subscription', String(tenant.id)] });
        qc.invalidateQueries({ queryKey: ['tenant-payments', String(tenant.id)] });
    };

    const save = useMutation({
        mutationFn: async () => {
            await tenantsAPI.update(tenant.id, {
                plan_id: form.plan_id ? Number(form.plan_id) : null,
                status: form.status,
                trial_ends_at: form.trial_ends_at || null,
            });
            if (form.follow_up_action === 'send_payment_link') {
                const r = await tenantsAPI.sendPaymentLink(tenant.id, { billing_cycle: form.billing_cycle });
                return r.message || 'Billing updated and payment link sent.';
            }
            if (form.follow_up_action === 'mark_paid') {
                const r = await tenantsAPI.markPaid(tenant.id, { billing_cycle: form.billing_cycle, amount: form.amount ? Number(form.amount) : undefined });
                return r.message || 'Billing updated and tenant marked as paid.';
            }
            return 'Billing settings updated.';
        },
        onSuccess: msg => { toast.success(msg); setForm(f => ({ ...f, amount: '', follow_up_action: 'none' })); refresh(); },
        onError: err => toast.error(apiError(err, 'Failed to update billing settings')),
    });

    const sendInvoice = useMutation({
        mutationFn: () => tenantsAPI.sendBillingInvoice(tenant.id, {
            billing_cycle: form.billing_cycle,
            billing_month: invoice.billing_month,
            due_date: invoice.due_date || undefined,
            amount: effective ? Number(effective) : undefined,
        }),
        onSuccess: r => { toast.success(r.message || 'Invoice and payment link sent.'); refresh(); },
        onError: err => toast.error(apiError(err, 'Failed to send billing invoice')),
    });

    return (
        <>
            <Panel title="Edit trial and billing" description="Change the plan or trial end, activate access, send a payment link or mark the tenant paid. New tenants already start as a 14-day trial.">
                <form id="billing-form" onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Plan">
                            <Select value={form.plan_id} onChange={set('plan_id')}>
                                <option value="">Select plan</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name} · ₹{p.price_monthly}/mo</option>)}
                            </Select>
                        </Field>
                        <Field label="Tenant status">
                            <Select value={form.status} onChange={set('status')}>
                                {['trial', 'active', 'suspended', 'cancelled', 'pending'].map(s => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
                            </Select>
                        </Field>
                        <Field label="Trial ends on"><Input type="date" value={form.trial_ends_at} onChange={set('trial_ends_at')} /></Field>
                        <Field label="Billing cycle">
                            <Select value={form.billing_cycle} onChange={set('billing_cycle')}>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </Select>
                        </Field>
                        <Field label="Manual amount" hint={plan ? `Suggested ${form.billing_cycle} amount: ${inr(suggested)}` : 'Pick a plan to suggest an amount'}>
                            <Input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder={suggested ? String(suggested) : 'Auto from plan'} className="font-mono" />
                        </Field>
                        <Field label="After saving">
                            <Select value={form.follow_up_action} onChange={set('follow_up_action')}>
                                <option value="none">Do nothing</option>
                                <option value="send_payment_link">Send payment link</option>
                                <option value="mark_paid">Mark paid and activate</option>
                            </Select>
                        </Field>
                    </div>
                    {form.follow_up_action === 'mark_paid' && (
                        <p role="status" className="rounded-sm border border-success/30 bg-success-soft px-3 py-2 text-sm text-success">
                            Saving records a successful manual payment of {inr(effective)} and activates the tenant.
                        </p>
                    )}
                    {form.follow_up_action === 'send_payment_link' && (
                        <p role="status" className="rounded-sm border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
                            Saving keeps these plan and trial values and emails the tenant a payment link.
                        </p>
                    )}
                    <div className="flex justify-end"><Button variant="primary" type="submit" loading={save.isPending}>Save billing changes</Button></div>
                </form>
            </Panel>

            <Panel title="Send billing invoice" description="A PDF invoice plus a Razorpay payment link for one billing month, e.g. last month's dues.">
                <form onSubmit={e => { e.preventDefault(); sendInvoice.mutate(); }} className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => setInvoice(i => ({ ...i, billing_month: monthValue(-1) }))}>Previous month</Button>
                        <Button size="sm" onClick={() => setInvoice(i => ({ ...i, billing_month: monthValue() }))}>Current month</Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Billing month" required><Input type="month" required value={invoice.billing_month} onChange={e => setInvoice(i => ({ ...i, billing_month: e.target.value }))} /></Field>
                        <Field label="Due date"><Input type="date" value={invoice.due_date} onChange={e => setInvoice(i => ({ ...i, due_date: e.target.value }))} /></Field>
                        <div className="rounded-sm border border-border bg-surface-2 px-3 py-2">
                            <p className="text-xs text-fg-muted">Invoice amount</p>
                            <p className="font-mono tabular-nums text-lg font-semibold text-fg">{inr(effective)}</p>
                            <p className="text-2xs text-fg-subtle">Manual amount above, else the plan amount</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="primary" type="submit" loading={sendInvoice.isPending} disabled={!invoice.billing_month}>Send invoice and payment link</Button>
                    </div>
                </form>
            </Panel>
        </>
    );
}

export default function BillingTab({ tenant }) {
    const id = String(tenant.id);
    const qc = useQueryClient();
    const [cancelNow, setCancelNow] = useState(null); // true | false | null

    const plansQuery = useQuery({ queryKey: ['plans'], queryFn: () => plansAPI.getAll().then(r => r.data || []), staleTime: 5 * 60 * 1000 });
    const subQuery = useQuery({
        queryKey: ['tenant-subscription', id],
        // 404 when no subscription exists yet: that's "none", not an error
        queryFn: () => billingAPI.getSubscription(id).then(r => r.data || null).catch(() => null),
    });
    const paymentsQuery = useQuery({ queryKey: ['tenant-payments', id], queryFn: () => billingAPI.getTenantPayments(id).then(r => r.data || []) });

    const sub = subQuery.data;
    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['tenant', id] });
        qc.invalidateQueries({ queryKey: ['tenant-subscription', id] });
    };
    const subAction = useMutation({
        mutationFn: ({ kind, immediate }) => (kind === 'pause' ? billingAPI.pauseSubscription(tenant.id) : kind === 'resume' ? billingAPI.resumeSubscription(tenant.id) : billingAPI.cancelSubscription(tenant.id, { immediate })),
        onSuccess: r => { toast.success(r.message || 'Subscription updated.'); setCancelNow(null); refresh(); },
        onError: err => { toast.error(apiError(err, 'Subscription action failed')); setCancelNow(null); },
    });
    const busy = subAction.isPending;
    const run = (kind, immediate) => subAction.mutate({ kind, immediate });
    const ended = !sub || ['cancelled', 'expired'].includes(sub.status);
    const trialDays = daysUntil(tenant.trial_ends_at);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Plan" value={<span className="text-base">{sub?.plan_name || tenant.plan_name || 'Unassigned'}</span>} />
                <StatCard label="Subscription" value={<span className="text-base capitalize">{sub?.status || 'None yet'}</span>} />
                <StatCard label="Billing cycle" value={<span className="text-base capitalize">{sub?.billing_cycle || 'monthly'}</span>} />
                <StatCard label="Period ends" value={<span className="text-base">{fmtDate(sub?.current_period_end) || 'Not set'}</span>} />
                <StatCard
                    label="Trial ends"
                    value={<span className="text-base">{fmtDate(tenant.trial_ends_at) || 'No trial'}</span>}
                    hint={tenant.status === 'trial' && trialDays !== null ? (trialDays >= 0 ? `${trialDays} day(s) left` : 'Trial expired') : undefined}
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={() => run('pause')} disabled={!sub || sub.status !== 'active' || busy}>Pause subscription</Button>
                <Button onClick={() => run('resume')} disabled={!sub || sub.status !== 'paused' || busy}>Resume subscription</Button>
                <Button onClick={() => setCancelNow(false)} disabled={ended || busy}>Cancel at period end</Button>
                <Button variant="danger" onClick={() => setCancelNow(true)} disabled={ended || busy}>Cancel immediately</Button>
            </div>

            {plansQuery.isLoading || subQuery.isLoading
                ? <Skeleton className="h-64 rounded-md" />
                // remount only when the values the form starts from actually change
                : <BillingForm key={`${tenant.plan_id}|${tenant.status}|${tenant.trial_ends_at}|${sub?.billing_cycle}`} tenant={tenant} plans={plansQuery.data || []} subscription={sub} />}

            <Panel title="Billing history" flush>
                <DataTable
                    caption="Payments"
                    loading={paymentsQuery.isLoading}
                    error={paymentsQuery.error}
                    onRetry={paymentsQuery.refetch}
                    rows={paymentsQuery.data || []}
                    empty={<EmptyState title="No payments yet" description="Payments for this tenant appear here." />}
                    columns={[
                        { key: 'date', header: 'Date', className: 'whitespace-nowrap text-fg-muted', render: p => fmtDate(p.created_at) },
                        { key: 'invoice', header: 'Invoice', mono: true, className: 'text-fg-muted', render: p => p.invoice_number || '—' },
                        { key: 'plan', header: 'Plan', render: p => p.plan_name || 'One-time payment' },
                        { key: 'amount', header: 'Amount', align: 'right', mono: true, render: p => inr(parseFloat(p.amount)) },
                        { key: 'status', header: 'Status', render: p => <Badge tone={PAYMENT_TONE[String(p.status).toLowerCase()] || 'warning'} className="capitalize">{p.status}</Badge> },
                    ]}
                />
            </Panel>

            <ConfirmDialog
                open={cancelNow !== null}
                onClose={() => setCancelNow(null)}
                onConfirm={() => run('cancel', cancelNow)}
                loading={busy}
                title={cancelNow ? 'Cancel subscription now?' : 'Cancel at period end?'}
                message={cancelNow ? 'The subscription is cancelled immediately and tenant access stops.' : 'Razorpay is asked to cancel when the current billing period ends.'}
                confirmText={cancelNow ? 'Cancel now' : 'Schedule cancel'}
            />
        </div>
    );
}
