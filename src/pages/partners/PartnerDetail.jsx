import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    FiArrowLeft, FiRefreshCw, FiKey, FiAlertTriangle, FiCopy, FiClock, FiTerminal
} from '../../components/icons/FeatherIcons';
import partnersAPI from '../../api/partners';

/**
 * Partner instance detail (P1-04, P1-05).
 *
 * The tenant table is a mirror: it is whatever the instance last reported, never
 * something this panel can edit. Actions are queued as commands the instance
 * pulls on its next heartbeat, which is why every one of them says "queued"
 * rather than pretending to have taken effect.
 */

const relativeTime = (value) => {
    if (!value) return 'never';
    const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
};

const Card = ({ title, children, action }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
            {action}
        </div>
        {children}
    </div>
);

const PartnerDetail = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [rotatedSecret, setRotatedSecret] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['partner', id],
        queryFn: () => partnersAPI.getById(id),
        staleTime: 60 * 1000,
    });

    const commandMutation = useMutation({
        mutationFn: ({ command, args }) => partnersAPI.queueCommand(id, command, args),
        onSuccess: (res) => {
            toast.success(res.message || 'Command queued');
            queryClient.invalidateQueries({ queryKey: ['partner', id] });
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to queue command'),
    });

    const rotateMutation = useMutation({
        mutationFn: () => partnersAPI.rotateSecret(id),
        onSuccess: (res) => setRotatedSecret(res.sync_secret),
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to rotate secret'),
    });

    if (isLoading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;

    const { instance, tenants = [], logs = [], commands = [] } = data?.data || {};
    if (!instance) return <div className="p-6 text-sm text-slate-500">Partner not found.</div>;

    let health = instance.health_json;
    if (typeof health === 'string') {
        try { health = JSON.parse(health); } catch { health = null; }
    }

    // Decided server-side: the master owns the clock, and a skewed browser clock
    // must not be what tells an operator whether a partner is reporting.
    const isStale = Boolean(instance.is_stale);

    return (
        <div className="p-6">
            <Link to="/partners" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600">
                <FiArrowLeft /> All partners
            </Link>

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{instance.name}</h1>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {instance.base_domain || instance.slug} · {instance.edition || 'unknown edition'} ·{' '}
                        <span className="font-mono">{instance.git_sha || '—'}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => commandMutation.mutate({ command: 'force_resync', args: {} })}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                        <FiRefreshCw /> Force resync
                    </button>
                    <button
                        onClick={() => rotateMutation.mutate()}
                        className="flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                    >
                        <FiKey /> Rotate secret
                    </button>
                </div>
            </div>

            {isStale && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                    <FiAlertTriangle className="mt-0.5 text-amber-600" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>This instance is not reporting.</strong> Last heartbeat{' '}
                        {relativeTime(instance.last_seen_at)}. The figures below are the last
                        values it sent and may no longer reflect reality.
                    </div>
                </div>
            )}

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <Card title="Health">
                    <dl className="space-y-2 text-sm">
                        {[
                            ['Last seen', relativeTime(instance.last_seen_at)],
                            ['Last full sync', relativeTime(instance.last_full_sync_at)],
                            ['Uptime', health?.uptime_s ? `${Math.round(health.uptime_s / 3600)}h` : '—'],
                            ['DB size', health?.db_size_mb ? `${health.db_size_mb} MB` : '—'],
                            ['Memory used', health?.mem_used_pct != null ? `${health.mem_used_pct}%` : '—'],
                            ['Errored processes', health?.pm2_errored ?? '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                                <dd className="font-medium text-slate-900 dark:text-white">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>

                <Card title="Commercials">
                    <dl className="space-y-2 text-sm">
                        {[
                            ['Billing model', instance.billing_model],
                            ['Wholesale / mo', instance.wholesale_price_monthly ?? '—'],
                            ['Revshare %', instance.revshare_pct ?? '—'],
                            ['Tenant quota', `${tenants.length} / ${instance.tenant_quota}`],
                            ['Status', instance.status],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                                <dd className="font-medium text-slate-900 dark:text-white">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>

                <Card title="Contact">
                    <dl className="space-y-2 text-sm">
                        {[
                            ['Name', instance.contact_name || '—'],
                            ['Email', instance.contact_email || '—'],
                            ['Phone', instance.contact_phone || '—'],
                            ['Admin URL', instance.admin_url || '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-3">
                                <dt className="shrink-0 text-slate-500 dark:text-slate-400">{k}</dt>
                                <dd className="truncate font-medium text-slate-900 dark:text-white">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>
            </div>

            <div className="mb-6">
                <Card title={`Tenants (${tenants.length})`}>
                    {tenants.length === 0 ? (
                        <p className="text-sm text-slate-500">No tenants reported yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                                    <tr>
                                        <th className="pb-2">Tenant</th>
                                        <th className="pb-2">Status</th>
                                        <th className="pb-2">Plan</th>
                                        <th className="pb-2">Industry</th>
                                        <th className="pb-2 text-right">Users</th>
                                        <th className="pb-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tenants.map((t) => (
                                        <tr key={t.id} className={t.is_stale ? 'opacity-50' : ''}>
                                            <td className="py-2">
                                                <div className="font-medium text-slate-900 dark:text-white">{t.name || t.tenant_slug}</div>
                                                <div className="text-xs text-slate-400">{t.tenant_slug}</div>
                                            </td>
                                            <td className="py-2">{t.status}</td>
                                            <td className="py-2">{t.plan_slug || '—'}</td>
                                            <td className="py-2">{t.industry_type || '—'}</td>
                                            <td className="py-2 text-right">{t.users ?? 0}</td>
                                            <td className="py-2 text-right">
                                                <button
                                                    onClick={() => commandMutation.mutate({
                                                        command: t.status === 'suspended' ? 'resume_tenant' : 'suspend_tenant',
                                                        args: { tenant_slug: t.tenant_slug },
                                                    })}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                                >
                                                    {t.status === 'suspended' ? 'Resume' : 'Suspend'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Command queue">
                    {commands.length === 0 ? (
                        <p className="text-sm text-slate-500">Nothing queued.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {commands.map((c) => (
                                <li key={c.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
                                    <div>
                                        <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                                            <FiTerminal className="text-xs" /> {c.command}
                                        </span>
                                        {c.result && <p className="mt-0.5 text-xs text-slate-500">{c.result}</p>}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                            c.status === 'acked' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : c.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {c.status}
                                        </span>
                                        <p className="mt-0.5 text-[11px] text-slate-400">{relativeTime(c.created_at)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Sync log">
                    {logs.length === 0 ? (
                        <p className="text-sm text-slate-500">No reports received.</p>
                    ) : (
                        <ul className="space-y-1.5 text-sm">
                            {logs.map((l) => (
                                <li key={l.id} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2">
                                        <span className={`h-1.5 w-1.5 rounded-full ${l.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <span className="text-slate-700 dark:text-slate-300">{l.kind}</span>
                                        {!l.ok && <span className="truncate text-xs text-red-500">{l.error}</span>}
                                    </span>
                                    <span className="shrink-0 text-[11px] text-slate-400">
                                        {l.ok ? `${l.tenants_count} tenants · ` : ''}{relativeTime(l.received_at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {rotatedSecret && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-start gap-3">
                            <FiAlertTriangle className="mt-0.5 text-amber-500" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New sync secret</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    This instance will stop reporting until{' '}
                                    <code className="font-mono">PARTNER_SYNC_SECRET</code> is updated
                                    there and the process restarts. Shown once only.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                            <code className="flex-1 break-all font-mono text-xs text-slate-800 dark:text-slate-200">
                                {rotatedSecret}
                            </code>
                            <button
                                onClick={() => { navigator.clipboard.writeText(rotatedSecret); toast.success('Copied'); }}
                                className="shrink-0 rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                <FiCopy />
                            </button>
                        </div>
                        <button
                            onClick={() => { setRotatedSecret(null); queryClient.invalidateQueries({ queryKey: ['partner', id] }); }}
                            className="mt-5 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700"
                        >
                            I have saved it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerDetail;
