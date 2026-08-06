import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FiCpu, FiAlertCircle } from 'react-icons/fi';
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

export default function TenantAiUsage({ tenantId }) {
    const [days, setDays] = useState(30);

    const { data, isLoading, error } = useQuery({
        queryKey: ['tenant-ai-usage', tenantId, days],
        queryFn: () => tenantsAPI.getAiUsage(tenantId, days),
        staleTime: 2 * 60 * 1000,
        enabled: Boolean(tenantId)
    });

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
                                    No ratings yet. Feedback appears here once users rate insights in the tenant CRM.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
