import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiCpu, FiAlertCircle, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { tenantsAPI } from '../../api';

/**
 * AI consumption for one tenant.
 *
 * Admin-side rather than in the CRM: AI is provided by us and not yet billed, so
 * the spend is our unit economics — a customer has no use for it, and showing it
 * would invite questions about a line item that does not exist yet.
 */

const RANGES = [7, 30, 90];

// Sub-cent amounts are the norm for a single day, so a fixed 2dp would render
// almost every real figure as "$0.00".
const usd = (value) => {
    const n = Number(value || 0);
    if (n === 0) return '$0';
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(2)}`;
};

const compactNumber = (value) => Number(value || 0).toLocaleString();

function Stat({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
            {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
        </div>
    );
}

const SEVERITY_STYLE = {
    critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
};

export default function TenantAiUsage({ tenantId }) {
    const [days, setDays] = useState(30);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['tenant-ai-usage', tenantId, days],
        queryFn: () => tenantsAPI.getAiUsage(tenantId, days),
        staleTime: 2 * 60 * 1000,
        enabled: Boolean(tenantId)
    });

    const { data: insightData } = useQuery({
        queryKey: ['tenant-ai-insights', tenantId],
        queryFn: () => tenantsAPI.getAiInsights(tenantId, 25),
        staleTime: 2 * 60 * 1000,
        enabled: Boolean(tenantId)
    });

    const rate = useMutation({
        mutationFn: ({ insight, rating }) => tenantsAPI.rateAiInsight(tenantId, insight.id, {
            rating,
            insightKey: insight.insightKey
        }),
        onSuccess: () => {
            // Both views move together: the rating changes the summary bars.
            queryClient.invalidateQueries({ queryKey: ['tenant-ai-insights', tenantId] });
            queryClient.invalidateQueries({ queryKey: ['tenant-ai-usage', tenantId] });
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to record rating')
    });

    const insights = insightData?.data?.insights || [];
    const ratingsEnabled = insightData?.data?.ratingsEnabled;

    const usage = data?.data;
    const totals = usage?.totals;
    const peakDay = (usage?.daily || []).reduce(
        (max, d) => (d.calls > (max?.calls ?? -1) ? d : max), null
    );

    return (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-slate-700">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <FiCpu className="h-5 w-5 text-brand-500" />
                        AI Usage &amp; Cost
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        What this tenant consumed on our provider account. Not visible to the tenant.
                    </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
                    {RANGES.map(r => (
                        <button
                            key={r}
                            onClick={() => setDays(r)}
                            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                                days === r
                                    ? 'bg-brand-500 text-white'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {r}d
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {isLoading && <p className="text-sm text-slate-400">Loading usage…</p>}

                {error && (
                    <p className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                        <FiAlertCircle className="h-4 w-4" />
                        {error.response?.data?.error || 'Failed to load AI usage'}
                    </p>
                )}

                {!isLoading && !error && usage && !usage.available && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {usage.reason || 'NapMind is not initialized on this tenant.'}
                    </p>
                )}

                {!isLoading && !error && usage?.available && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <Stat label="Cost" value={usd(totals?.costUsd)} hint={`last ${days} days`} />
                            <Stat label="Calls" value={compactNumber(totals?.calls)} />
                            <Stat label="Tokens in" value={compactNumber(totals?.tokensIn)} />
                            <Stat label="Tokens out" value={compactNumber(totals?.tokensOut)} />
                        </div>

                        {!usage.costTracked && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                Cost tracking starts after migration 119 runs on this tenant. Calls and tokens above are complete; cost is only counted from that point.
                            </p>
                        )}

                        {peakDay && (
                            <p className="text-xs text-slate-400">
                                Busiest day: {String(peakDay.date).slice(0, 10)} — {compactNumber(peakDay.calls)} calls, {usd(peakDay.costUsd)}
                            </p>
                        )}

                        {usage.byPurpose?.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Where it went</h4>
                                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-900/40">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Purpose</th>
                                                <th className="px-4 py-2 text-right font-medium">Calls</th>
                                                <th className="px-4 py-2 text-right font-medium">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usage.byPurpose.map(p => (
                                                <tr key={p.purpose} className="border-t border-slate-100 dark:border-slate-700">
                                                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{p.purpose}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{compactNumber(p.calls)}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{usd(p.costUsd)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Was it useful?
                            </h4>
                            {usage.feedback?.length > 0 ? (
                                <div className="space-y-1.5">
                                    {usage.feedback.map(f => {
                                        const rate = f.total ? Math.round((f.useful / f.total) * 100) : 0;
                                        return (
                                            <div key={f.subjectKey} className="flex items-center gap-3">
                                                <span className="w-56 shrink-0 truncate text-xs text-slate-600 dark:text-slate-400" title={f.subjectKey}>
                                                    {f.subjectKey}
                                                </span>
                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                                    {/* Green share is the proportion who found it worth surfacing;
                                                        a mostly-grey bar is a detector worth re-tuning. */}
                                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                                                </div>
                                                <span className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-400">
                                                    {f.useful}/{f.total} useful
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400">
                                    No ratings yet — rate the insights below and the pattern per detector builds up here.
                                </p>
                            )}
                        </div>

                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Recent insights
                            </h4>
                            {insights.length === 0 ? (
                                <p className="text-xs text-slate-400">No insights generated yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {insights.map(insight => (
                                        <div
                                            key={insight.id}
                                            className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-700"
                                        >
                                            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_STYLE[insight.severity] || SEVERITY_STYLE.low}`}>
                                                {insight.severity}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    {insight.title}
                                                </p>
                                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                    {insight.narrative}
                                                </p>
                                                <p className="mt-1 font-mono text-[10px] text-slate-400">
                                                    {insight.insightKey} · {insight.agent}
                                                </p>
                                            </div>
                                            {/* Our verdict on whether this should have fired — the
                                                tenant acts on the insight, we judge the detector. */}
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    disabled={!ratingsEnabled || rate.isPending}
                                                    onClick={() => rate.mutate({ insight, rating: 'useful' })}
                                                    title={ratingsEnabled ? 'Worth surfacing' : 'Run migration 119 on this tenant first'}
                                                    className={`rounded-md p-1.5 transition-colors disabled:opacity-40 ${
                                                        insight.rating === 'useful'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <FiThumbsUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    disabled={!ratingsEnabled || rate.isPending}
                                                    onClick={() => rate.mutate({ insight, rating: 'not_useful' })}
                                                    title={ratingsEnabled ? 'Noise — retune this detector' : 'Run migration 119 on this tenant first'}
                                                    className={`rounded-md p-1.5 transition-colors disabled:opacity-40 ${
                                                        insight.rating === 'not_useful'
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <FiThumbsDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
