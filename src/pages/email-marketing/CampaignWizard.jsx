import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheck, FiChevronRight, FiSend } from 'react-icons/fi';
import { nmCampaignsAPI, nmListsAPI, nmTemplatesAPI } from '../../api/nexmail';
import { Badge, Button, ConfirmDialog, Field, Input, PageHeader, Panel, Skeleton, Textarea, cx } from '../../components/ui';

const STEPS = ['Setup', 'Audience', 'Content', 'Spam check', 'Schedule'];
const SEVERITY_TONE = { critical: 'danger', high: 'danger', medium: 'warning' };
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;
const scoreTone = s => (s >= 80 ? 'text-success' : s >= 60 ? 'text-warning' : 'text-danger');

function Choice({ selected, onClick, title, hint, children }) {
    return (
        <button type="button" aria-pressed={selected} onClick={onClick}
            className={cx('w-full rounded-sm border p-3 text-left transition-colors', selected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-2')}>
            {children}
            <span className="block text-sm font-medium text-fg">{title}</span>
            {hint && <span className="block text-xs text-fg-muted">{hint}</span>}
        </button>
    );
}

export default function CampaignWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [campaign, setCampaign] = useState({
        name: '', type: 'regular', subject_a: '', subject_b: '', from_name: '', from_email: '', reply_to: '',
        list_id: null, segment_filter: null, template_id_a: null, html_content_a: '',
        ab_split_pct: 50, ab_winner_metric: 'open_rate', ab_winner_wait_hours: 4, scheduled_at: null, send_now: true,
    });
    const [spam, setSpam] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [draftId, setDraftId] = useState(null); // created by "Send test" so the real send can reuse it
    const [confirmSend, setConfirmSend] = useState(false);
    const update = (k, v) => setCampaign(p => ({ ...p, [k]: v }));
    const field = k => e => update(k, e.target.value);

    const lists = useQuery({ queryKey: ['nexmail-lists'], queryFn: () => nmListsAPI.getAll().then(r => r.data || []), staleTime: 5 * 60 * 1000 }).data || [];
    const templates = useQuery({ queryKey: ['nexmail-templates', { status: 'active' }], queryFn: () => nmTemplatesAPI.getAll({ status: 'active' }).then(r => r.data || []), staleTime: 5 * 60 * 1000 }).data || [];
    const estimate = useQuery({
        queryKey: ['nexmail-estimate', campaign.list_id, campaign.segment_filter],
        queryFn: () => nmCampaignsAPI.estimateAudience({ list_id: campaign.list_id, segment_filter: campaign.segment_filter }).then(r => r.count),
        enabled: step >= 1,
        staleTime: 60 * 1000,
    });
    const listName = lists.find(l => l.id === campaign.list_id)?.name;

    const spamCheck = useMutation({
        mutationFn: () => nmTemplatesAPI.checkSpam({ subject: campaign.subject_a, html_content: campaign.html_content_a || undefined, from_email: campaign.from_email }),
        onSuccess: r => setSpam(r.data),
        onError: () => { setSpam(null); toast.error('Spam check failed'); },
    });

    const saveDraft = async () => {
        if (draftId) { await nmCampaignsAPI.update(draftId, campaign); return draftId; }
        const r = await nmCampaignsAPI.create(campaign);
        setDraftId(r.campaignId);
        return r.campaignId;
    };
    const sendTest = useMutation({
        mutationFn: async () => nmCampaignsAPI.sendTest(await saveDraft(), testEmail),
        onSuccess: () => toast.success(`Test email sent to ${testEmail}`),
        onError: err => toast.error(apiErr(err, 'Could not send the test email')),
    });
    const create = useMutation({
        mutationFn: async () => {
            const id = await saveDraft();
            if (campaign.send_now) await nmCampaignsAPI.send(id);
            return id;
        },
        onSuccess: () => { toast.success(campaign.send_now ? 'Campaign queued for sending' : 'Campaign scheduled'); navigate('/email-marketing/campaigns'); },
        onError: err => {
            setConfirmSend(false);
            const d = err.response?.data;
            toast.error(d?.error || 'Failed to create campaign');
            // The send was blocked on spam score: show the report
            if (d?.spam_score !== undefined) { setSpam({ score: d.spam_score, rating: d.rating, issues: d.issues || [], suggestions: d.suggestions || [] }); setStep(3); }
        },
    });

    const goTo = i => { setStep(i); if (i === 3) spamCheck.mutate(); };
    const scheduleOk = campaign.send_now || !!campaign.scheduled_at;
    const canProceed = [
        !!(campaign.name && campaign.subject_a),
        true,
        !!(campaign.html_content_a || campaign.template_id_a),
        !!spam && spam.score >= 20,
        scheduleOk,
    ][step];
    const finalAction = () => (campaign.send_now ? setConfirmSend(true) : create.mutate());

    return (
        <div className="max-w-4xl space-y-4">
            <PageHeader back={{ to: '/email-marketing/campaigns', label: 'Campaigns' }} title="Create campaign" />

            <ol className="flex items-center gap-1 overflow-x-auto rounded-md border border-border bg-surface p-2" aria-label="Steps">
                {STEPS.map((s, i) => (
                    <li key={s} className="flex shrink-0 items-center gap-1">
                        <button type="button" disabled={i > step} onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined}
                            className={cx('flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap',
                                i === step ? 'bg-accent text-accent-fg' : i < step ? 'bg-accent-soft text-accent' : 'text-fg-subtle')}>
                            <span className="grid size-5 place-items-center rounded-full border border-current text-2xs">{i < step ? <FiCheck className="size-3" /> : i + 1}</span>{s}
                        </button>
                        {i < STEPS.length - 1 && <FiChevronRight aria-hidden="true" className="size-4 text-fg-subtle" />}
                    </li>
                ))}
            </ol>

            <Panel title={STEPS[step]} className="min-h-[360px]">
                {step === 0 && (
                    <div className="max-w-lg space-y-4">
                        <Field label="Campaign name" required><Input value={campaign.name} onChange={field('name')} placeholder="May newsletter" data-autofocus /></Field>
                        <Field label="Subject line" required hint="Use {{first_name}} to personalise"><Input value={campaign.subject_a} onChange={field('subject_a')} placeholder="{{first_name}}, here's what's new" /></Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="From name"><Input value={campaign.from_name} onChange={field('from_name')} placeholder="Your company" /></Field>
                            <Field label="From email"><Input type="email" value={campaign.from_email} onChange={field('from_email')} placeholder="hello@yourdomain.com" /></Field>
                        </div>
                        <fieldset>
                            <legend className="mb-1.5 text-sm font-medium text-fg">Type</legend>
                            <div className="grid grid-cols-2 gap-2">
                                <Choice selected={campaign.type === 'regular'} onClick={() => update('type', 'regular')} title="Regular" />
                                <Choice selected={campaign.type === 'ab_test'} onClick={() => update('type', 'ab_test')} title="A/B test" />
                            </div>
                        </fieldset>
                        {campaign.type === 'ab_test' && <Field label="Subject B"><Input value={campaign.subject_b} onChange={field('subject_b')} placeholder="Alternative subject" /></Field>}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <Choice selected={!campaign.list_id} onClick={() => update('list_id', null)} title="All contacts" hint="Everyone who is subscribed" />
                            {lists.map(l => <Choice key={l.id} selected={campaign.list_id === l.id} onClick={() => update('list_id', l.id)} title={l.name} hint={`${l.contact_count || 0} contacts`} />)}
                        </div>
                        <p role="status" className="rounded-sm border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                            Estimated recipients: {estimate.isLoading ? '…' : estimate.data != null ? <strong className="font-mono tabular-nums text-fg">{estimate.data.toLocaleString('en-IN')}</strong> : 'unavailable'}
                        </p>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        {templates.length > 0 && (
                            <div>
                                <p className="mb-1.5 text-sm font-medium text-fg">Start from a template</p>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                    {templates.map(t => <Choice key={t.id} selected={campaign.template_id_a === t.id} onClick={() => update('template_id_a', t.id)} title={t.name} hint={t.category} />)}
                                </div>
                            </div>
                        )}
                        <Field label="Or paste custom HTML"><Textarea rows={10} value={campaign.html_content_a} onChange={field('html_content_a')} spellCheck={false} className="font-mono text-xs" placeholder="<h1>Hello {{first_name}}!</h1>" /></Field>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/email-marketing/templates/new')}>Open the template builder</Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5">
                        {spamCheck.isPending ? <Skeleton className="h-32 rounded-md" /> : spam ? (
                            <>
                                <div className="flex items-center gap-5">
                                    <p className={cx('font-mono tabular-nums text-4xl font-semibold', scoreTone(spam.score))}>{spam.score}<span className="text-base text-fg-subtle">/100</span></p>
                                    <div>
                                        <p className={cx('text-lg font-semibold', scoreTone(spam.score))}>{spam.rating}</p>
                                        <p className="text-sm text-fg-muted">{spam.issues?.length || 0} issue{spam.issues?.length === 1 ? '' : 's'} found</p>
                                        {spam.score < 20 && <p role="alert" className="text-sm font-medium text-danger">Blocked. Fix the critical issues before sending.</p>}
                                    </div>
                                </div>
                                {spam.issues?.length > 0 && (
                                    <ul className="divide-y divide-border rounded-sm border border-border">
                                        {spam.issues.map((issue, i) => (
                                            <li key={i} className="flex items-start gap-3 px-3 py-2">
                                                <Badge tone={SEVERITY_TONE[issue.severity] || 'neutral'}>{issue.severity}</Badge>
                                                <span className="text-sm text-fg">{issue.message}</span>
                                                <span className="ml-auto font-mono text-2xs text-fg-subtle">-{issue.penalty} pts</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {spam.suggestions?.length > 0 && (
                                    <div className="rounded-sm border border-border bg-surface-2 p-3">
                                        <p className="mb-1 text-sm font-medium text-fg">Suggestions</p>
                                        <ul className="space-y-1">{spam.suggestions.map((s, i) => <li key={i} className="text-sm text-fg-muted">• {s}</li>)}</ul>
                                    </div>
                                )}
                                {spam.deliverabilityTips && (
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        {spam.deliverabilityTips.map((t, i) => <p key={i} className="text-xs text-fg-muted"><span className="font-medium text-fg">{t.category}:</span> {t.tip}</p>)}
                                    </div>
                                )}
                                <Button size="sm" onClick={() => spamCheck.mutate()}>Re-check score</Button>

                                <form onSubmit={e => { e.preventDefault(); sendTest.mutate(); }} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
                                    <Field label="Send a test email" hint="Saves this campaign as a draft first" className="min-w-56 flex-1 max-w-xs">
                                        <Input type="email" required value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="you@yourdomain.com" />
                                    </Field>
                                    <Button type="submit" loading={sendTest.isPending}>Send test</Button>
                                </form>
                            </>
                        ) : (
                            <p className="flex items-center gap-2 py-10 text-sm text-fg-muted"><FiAlertTriangle className="size-4" />Couldn&apos;t score this email. Check that the previous steps have content.</p>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="max-w-lg space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Choice selected={campaign.send_now} onClick={() => update('send_now', true)} title="Send now" hint="Start sending immediately" />
                            <Choice selected={!campaign.send_now} onClick={() => update('send_now', false)} title="Schedule" hint="Pick a date and time" />
                        </div>
                        {!campaign.send_now && (
                            <Field label="Send date and time" required error={!campaign.scheduled_at ? 'Choose when to send' : undefined}>
                                <Input type="datetime-local" value={campaign.scheduled_at || ''} onChange={field('scheduled_at')} />
                            </Field>
                        )}
                        <dl className="space-y-1 rounded-sm border border-border bg-surface-2 p-4 text-sm">
                            {[
                                ['Name', campaign.name], ['Subject', campaign.subject_a],
                                ['Audience', `${campaign.list_id ? (listName || `List #${campaign.list_id}`) : 'All contacts'}${estimate.data != null ? ` (about ${estimate.data.toLocaleString('en-IN')})` : ''}`],
                                ['Spam score', spam ? `${spam.score}/100 (${spam.rating})` : 'Not checked'],
                                ['When', campaign.send_now ? 'Immediately' : campaign.scheduled_at || 'Not set'],
                            ].map(([k, v]) => <div key={k} className="flex gap-3"><dt className="w-24 shrink-0 text-fg-muted">{k}</dt><dd className="min-w-0 break-words text-fg">{v}</dd></div>)}
                        </dl>
                    </div>
                )}
            </Panel>

            <div className="flex items-center justify-between">
                <Button onClick={() => (step > 0 ? goTo(step - 1) : navigate('/email-marketing/campaigns'))}>{step === 0 ? 'Cancel' : 'Back'}</Button>
                {step < STEPS.length - 1
                    ? <Button variant="primary" onClick={() => goTo(step + 1)} disabled={!canProceed || spamCheck.isPending}>Next<FiChevronRight className="size-4" /></Button>
                    : <Button variant="primary" onClick={finalAction} loading={create.isPending} disabled={!scheduleOk}><FiSend className="size-4" />{campaign.send_now ? 'Create and send' : 'Schedule'}</Button>}
            </div>

            <ConfirmDialog
                open={confirmSend}
                onClose={() => setConfirmSend(false)}
                onConfirm={() => create.mutate()}
                loading={create.isPending}
                variant="primary"
                title="Send this campaign now?"
                message={`This emails ${estimate.data != null ? `about ${estimate.data.toLocaleString('en-IN')} people` : 'your audience'} straight away and can't be recalled.`}
                confirmText="Send now"
            />
        </div>
    );
}
