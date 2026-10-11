import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { nmCampaignsAPI } from '../../api/nexmail';
import { useChartTheme } from '../../components/charts/useChartTheme';
import {
    Button, ConfirmDialog, DataTable, EmptyState, ErrorState, PageHeader, Panel, Skeleton, StatCard, StatusBadge, Tabs, cx,
} from '../../components/ui';

const FILTERS = ['all', 'sent', 'opened', 'clicked', 'bounced', 'failed'].map(id => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
const when = v => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const num = v => parseInt(v, 10) || 0;
const VERB = { send: 'sent', pause: 'paused', resume: 'resumed' };

export default function CampaignDetail() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const t = useChartTheme();
    const [filter, setFilter] = useState('all');
    const [confirmSend, setConfirmSend] = useState(false);

    // Campaign and analytics are independent of the recipient filter, so filtering doesn't refetch them
    const detail = useQuery({
        queryKey: ['nexmail-campaign', id],
        queryFn: async () => {
            const [camp, analytics] = await Promise.allSettled([nmCampaignsAPI.getById(id), nmCampaignsAPI.getAnalytics(id)]);
            if (camp.status !== 'fulfilled' || !camp.value?.data) throw new Error('Campaign not found');
            return { campaign: camp.value.data, analytics: analytics.status === 'fulfilled' ? analytics.value.data : null };
        },
        // keep numbers moving while it is going out
        refetchInterval: q => (q.state.data?.campaign?.status === 'sending' ? 8000 : false),
    });
    const recipientsQuery = useQuery({
        queryKey: ['nexmail-campaign-recipients', id, filter],
        queryFn: () => nmCampaignsAPI.getRecipients(id, { limit: 50, ...(filter !== 'all' && { status: filter }) }).then(r => r.data || []),
        placeholderData: keepPreviousData,
        refetchInterval: detail.data?.campaign?.status === 'sending' ? 8000 : false,
    });

    const action = useMutation({
        mutationFn: kind => nmCampaignsAPI[kind](id),
        onSuccess: (_, kind) => {
            toast.success(`Campaign ${VERB[kind]}`);
            setConfirmSend(false);
            queryClient.invalidateQueries({ queryKey: ['nexmail-campaign', id] });
            queryClient.invalidateQueries({ queryKey: ['nexmail-campaign-recipients', id] });
            queryClient.invalidateQueries({ queryKey: ['nexmail-campaigns'] });
        },
        onError: (err, kind) => { toast.error(err.response?.data?.error || `Failed to ${kind}`); setConfirmSend(false); },
    });

    if (detail.isLoading) return <div className="max-w-6xl space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-24 rounded-md" /><Skeleton className="h-64 rounded-md" /></div>;
    if (detail.isError) return <ErrorState error={detail.error} onRetry={detail.refetch} />;

    const { campaign, analytics } = detail.data;
    const funnel = analytics ? [
        { name: 'Sent', value: num(analytics.total) }, { name: 'Delivered', value: num(analytics.delivered) },
        { name: 'Opened', value: num(analytics.unique_opens) }, { name: 'Clicked', value: num(analytics.unique_clicks) },
    ] : [];

    let actions = null;
    if (campaign.status === 'draft') actions = <Button variant="primary" onClick={() => setConfirmSend(true)}>Send now</Button>;
    else if (campaign.status === 'sending') actions = <Button onClick={() => action.mutate('pause')} loading={action.isPending}>Pause</Button>;
    else if (campaign.status === 'paused') actions = <Button variant="primary" onClick={() => action.mutate('resume')} loading={action.isPending}>Resume</Button>;

    const info = [
        ['From', `${campaign.from_name} <${campaign.from_email}>`], ['Type', campaign.type], ['Created', when(campaign.created_at)],
        ...(campaign.started_at ? [['Started', when(campaign.started_at)]] : []), ...(campaign.completed_at ? [['Completed', when(campaign.completed_at)]] : []),
    ];

    return (
        <div className="max-w-6xl space-y-4">
            <PageHeader
                back={{ to: '/email-marketing/campaigns', label: 'Campaigns' }}
                title={campaign.name}
                description={<span className="flex flex-wrap items-center gap-2"><span>Subject: {campaign.subject_a}</span><StatusBadge entity="emailCampaign" status={campaign.status} /></span>}
                actions={actions}
            />

            {analytics && (
                <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                        <StatCard label="Sent" value={num(analytics.total).toLocaleString('en-IN')} />
                        <StatCard label="Delivered" value={num(analytics.delivered).toLocaleString('en-IN')} />
                        <StatCard label="Opened" value={num(analytics.unique_opens).toLocaleString('en-IN')} hint={`${analytics.open_rate}%`} />
                        <StatCard label="Clicked" value={num(analytics.unique_clicks).toLocaleString('en-IN')} hint={`${analytics.click_rate}%`} />
                        <StatCard label="Bounced" value={num(analytics.bounced).toLocaleString('en-IN')} hint={`${analytics.bounce_rate}%`} />
                        <StatCard label="Unsubscribed" value={num(analytics.unsubscribed).toLocaleString('en-IN')} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Panel title="Delivery funnel">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} stroke={t.grid} />
                                    <XAxis type="number" tick={t.axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={80} tick={t.axisTick} tickLine={false} axisLine={false} />
                                    <Tooltip {...t.tooltip} />
                                    <Bar dataKey="value" name="Recipients" fill={t.series[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Panel>
                        <Panel title="Campaign info">
                            <dl className="space-y-2 text-sm">
                                {info.map(([k, v]) => (
                                    <div key={k} className="flex gap-3"><dt className="w-24 shrink-0 text-fg-muted">{k}</dt><dd className="min-w-0 break-words text-fg">{v}</dd></div>
                                ))}
                            </dl>
                        </Panel>
                    </div>
                </>
            )}

            <div className="space-y-3">
                <Tabs label="Recipient status" tabs={FILTERS} value={filter} onChange={setFilter} />
                <Panel title="Recipients" description="Most recent 50 for this filter" flush>
                    <DataTable
                        caption="Recipients"
                        loading={recipientsQuery.isLoading}
                        error={recipientsQuery.error}
                        onRetry={recipientsQuery.refetch}
                        rows={recipientsQuery.data || []}
                        className={cx(recipientsQuery.isPlaceholderData && 'opacity-60')}
                        empty={<EmptyState title={filter === 'all' ? 'No recipient data yet' : `No ${filter} recipients`} />}
                        columns={[
                            { key: 'email', header: 'Email', render: r => r.email },
                            { key: 'status', header: 'Status', render: r => <StatusBadge entity="emailCampaign" status={r.status} /> },
                            { key: 'opens', header: 'Opens', align: 'right', mono: true, render: r => r.open_count || 0 },
                            { key: 'clicks', header: 'Clicks', align: 'right', mono: true, render: r => r.click_count || 0 },
                            { key: 'sent', header: 'Sent at', className: 'whitespace-nowrap text-fg-muted', render: r => when(r.sent_at) },
                        ]}
                    />
                </Panel>
            </div>

            <ConfirmDialog
                open={confirmSend}
                onClose={() => setConfirmSend(false)}
                onConfirm={() => action.mutate('send')}
                loading={action.isPending}
                variant="primary"
                title="Send this campaign now?"
                message="This emails every recipient in the audience and can't be recalled."
                confirmText="Send now"
            />
        </div>
    );
}
