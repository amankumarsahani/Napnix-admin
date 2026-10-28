import {
    Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Panel, cx } from '../../../components/ui';
import { useChartTheme } from '../../../components/charts/useChartTheme';
import { formatFull, formatTick } from './metricsData';

const fmtValue = (v, unit) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString()}${unit ? ` ${unit}` : ''}`);

/** Crosshair tooltip: every series at this X, value first, short line key per series. */
function SeriesTooltip({ active, payload, label, unit, labels }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-[var(--elev-pop)]">
            <p className="mb-1 font-medium text-fg-muted">{formatFull(label)}</p>
            {payload.map(p => (
                <p key={p.dataKey} className="flex items-center gap-2 py-0.5">
                    <span aria-hidden="true" className="inline-block h-0.5 w-3 rounded-full" style={{ background: p.color }} />
                    <span className="font-semibold font-mono tabular-nums text-fg">{fmtValue(p.value, unit)}</span>
                    <span className="text-fg-muted">{labels?.[p.dataKey] || p.name}</span>
                </p>
            ))}
        </div>
    );
}

function TimeAxis({ chart, from, to, range }) {
    return (
        <XAxis
            dataKey="t" type="number" scale="time" domain={[from, to]}
            tickFormatter={t => formatTick(t, range)} tick={chart.axisTick}
            stroke={chart.grid} tickLine={false} minTickGap={48}
        />
    );
}

/**
 * One metric over time, one line per series. One y-axis only; `reference`
 * draws a labelled horizontal line (e.g. CPU core count).
 */
export function MetricPanel({ title, description, unit, rows, series, from, to, range, fetching, reference, yDomain, className }) {
    const chart = useChartTheme();
    const hasData = rows.some(r => series.some(s => r[s.key] !== null && r[s.key] !== undefined));
    const labels = Object.fromEntries(series.map(s => [s.key, s.label]));
    return (
        <Panel title={title} description={description} className={className}>
            <div className={cx('transition-opacity', fetching && 'opacity-60')} aria-label={title} role="img">
                {!hasData ? (
                    <p className="flex h-[220px] items-center justify-center text-sm text-fg-subtle">No data in this range</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                            <TimeAxis chart={chart} from={from} to={to} range={range} />
                            <YAxis tick={chart.axisTick} stroke={chart.grid} tickLine={false} width={48} domain={yDomain || [0, 'auto']} allowDecimals={false} />
                            <Tooltip content={<SeriesTooltip unit={unit} labels={labels} />} cursor={{ stroke: chart.muted, strokeWidth: 1 }} isAnimationActive={false} />
                            {series.length > 1 && <Legend iconType="plainline" iconSize={14} wrapperStyle={chart.legend.wrapperStyle} formatter={v => <span style={{ color: chart.muted }}>{v}</span>} />}
                            {reference && (
                                <ReferenceLine y={reference.value} stroke={chart.muted} strokeDasharray="4 4"
                                    label={{ value: reference.label, position: 'insideTopRight', fill: chart.muted, fontSize: 11 }} />
                            )}
                            {series.map(s => (
                                <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2}
                                    dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: chart.surface }}
                                    connectNulls={false} isAnimationActive={false} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Panel>
    );
}

const STATE_CLASS = {
    up: 'bg-success',
    partial: 'bg-warning',
    down: 'bg-danger',
    none: 'bg-surface-3',
};
const STATE_LABEL = { up: 'Up', partial: 'Some checks failed', down: 'Down', none: 'No data' };

/** Grafana-style state timeline: one row per tenant, one cell per bucket. */
export function StateTimeline({ rows, fetching }) {
    return (
        <Panel title="Availability" description="Each cell is one time bucket. Hover a cell for its checks.">
            <div className={cx('space-y-1.5 transition-opacity', fetching && 'opacity-60')}>
                {rows.map(({ tenant, cells }) => (
                    <div key={tenant.id} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 truncate text-xs text-fg-muted" title={tenant.name}>{tenant.slug}</span>
                        <div className="flex h-5 flex-1 gap-px overflow-hidden rounded-sm" role="list" aria-label={`${tenant.slug} availability`}>
                            {cells.map(c => (
                                <span
                                    key={c.t}
                                    role="listitem"
                                    title={`${formatFull(c.t)} · ${STATE_LABEL[c.state]}${c.checks ? ` (${c.ok}/${c.checks} OK)` : ''}`}
                                    aria-label={`${formatFull(c.t)}: ${STATE_LABEL[c.state]}`}
                                    className={cx('min-w-[2px] flex-1 hover:opacity-70', STATE_CLASS[c.state])}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-fg-muted">
                    {Object.entries(STATE_LABEL).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1.5">
                            <span aria-hidden="true" className={cx('size-2.5 rounded-sm', STATE_CLASS[k])} />{v}
                        </span>
                    ))}
                </div>
            </div>
        </Panel>
    );
}

// Three status buckets, so each stack colour is a reserved status colour with its own label.
const ALERT_GROUPS = [
    { key: 'urgent', label: 'Critical / high', of: ['critical', 'high'], tone: 'danger' },
    { key: 'medium', label: 'Medium', of: ['medium'], tone: 'warning' },
    { key: 'minor', label: 'Low / info', of: ['low', 'info'], tone: 'subtle' },
];

/** New alerts per bucket, stacked by severity group. */
export function AlertsPanel({ rows: raw, from, to, range, fetching }) {
    const chart = useChartTheme();
    const rows = raw.map(r => ({ t: r.t, ...Object.fromEntries(ALERT_GROUPS.map(g => [g.key, g.of.reduce((a, k) => a + r[k], 0)])) }));
    const total = rows.reduce((s, r) => s + ALERT_GROUPS.reduce((a, g) => a + r[g.key], 0), 0);
    return (
        <Panel title="New alerts" description={`${total} in this range, by severity`}>
            <div className={cx('transition-opacity', fetching && 'opacity-60')} role="img" aria-label="New alerts by severity">
                {total === 0 ? (
                    <p className="flex h-[220px] items-center justify-center text-sm text-fg-subtle">No alerts in this range</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                            <TimeAxis chart={chart} from={from} to={to} range={range} />
                            <YAxis tick={chart.axisTick} stroke={chart.grid} tickLine={false} width={48} allowDecimals={false} />
                            <Tooltip content={<SeriesTooltip labels={Object.fromEntries(ALERT_GROUPS.map(g => [g.key, g.label]))} />} cursor={{ fill: chart.grid, opacity: 0.3 }} isAnimationActive={false} />
                            <Legend iconType="rect" iconSize={10} wrapperStyle={chart.legend.wrapperStyle} formatter={v => <span style={{ color: chart.muted }}>{v}</span>} />
                            {ALERT_GROUPS.map(g => (
                                <Bar key={g.key} dataKey={g.key} name={g.label} stackId="a" fill={chart[g.tone]} stroke={chart.surface} strokeWidth={1} isAnimationActive={false} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Panel>
    );
}
