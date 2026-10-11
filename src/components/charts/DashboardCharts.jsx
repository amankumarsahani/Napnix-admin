/**
 * Dashboard charts (Recharts) on theme-aware colours from useChartTheme.
 * Each status keeps a fixed series slot, so its colour never shifts when another status is 0.
 */
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartTheme } from './useChartTheme';

function Empty({ children }) {
    return <div className="h-64 grid place-items-center text-sm text-fg-subtle">{children}</div>;
}

// slot = index into theme.series
const LEAD_SLICES = [['New', 'newLeads', 0], ['Qualified', 'qualified', 2], ['Won', 'won', 5], ['Lost', 'lost', 1]];
const INQUIRY_SLICES = [['New', 'newCount', 0], ['Contacted', 'contactedCount', 3], ['Resolved', 'resolvedCount', 2], ['Converted', 'convertedCount', 5]];

function StatusDonut({ data, slices, unit, emptyText }) {
    const t = useChartTheme();
    const chartData = slices
        .map(([name, key, slot]) => ({ name, value: Number(data?.[key]) || 0, color: t.series[slot] }))
        .filter(d => d.value > 0);

    if (!chartData.length) return <Empty>{emptyText}</Empty>;

    return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={92}
                    paddingAngle={2} stroke={t.surface} strokeWidth={2}>
                    {chartData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} ${unit}`, 'Count']} {...t.tooltip} />
                <Legend iconType="circle" iconSize={9} {...t.legend} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function LeadStatusChart({ data }) {
    return <StatusDonut data={data} slices={LEAD_SLICES} unit="leads" emptyText="No lead data yet" />;
}

export function InquiryStatusChart({ data }) {
    return <StatusDonut data={data} slices={INQUIRY_SLICES} unit="inquiries" emptyText="No inquiry data yet" />;
}

// Two headline ratios with a progress ring each
export function ConversionRateCard({ inquiryStats, leadStats }) {
    const ratio = (n, d) => (d > 0 ? (n / d) * 100 : 0);
    const metrics = [
        { label: 'Inquiry → Lead', value: ratio(inquiryStats?.convertedCount || 0, inquiryStats?.total || 0), count: inquiryStats?.convertedCount || 0, total: inquiryStats?.total || 0 },
        { label: 'Lead win rate', value: ratio(leadStats?.won || 0, leadStats?.total || 0), count: leadStats?.won || 0, total: leadStats?.total || 0 },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map(m => (
                <div key={m.label} className="flex items-center gap-4 rounded-sm border border-border p-4">
                    <div className="relative size-16 shrink-0" role="img" aria-label={`${m.label}: ${m.value.toFixed(1)}%`}>
                        <svg className="size-16 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                            <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-surface-3" />
                            <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeLinecap="round"
                                strokeDasharray={`${m.value * 0.88} 88`} className="stroke-accent" />
                        </svg>
                        <span className="absolute inset-0 grid place-items-center font-mono tabular-nums text-xs font-semibold text-fg">{m.value.toFixed(1)}%</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-fg">{m.label}</p>
                        <p className="text-xs text-fg-subtle mt-0.5"><span className="font-mono tabular-nums">{m.count}</span> of <span className="font-mono tabular-nums">{m.total}</span></p>
                    </div>
                </div>
            ))}
        </div>
    );
}
