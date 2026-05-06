/**
 * Dashboard Charts using Recharts
 * Contains PieChart for lead status, BarChart for leads by assignee, etc.
 */
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Lead Status Pie Chart
export function LeadStatusChart({ data }) {
    const chartData = [
        { name: 'New', value: data?.newLeads || 0 },
        { name: 'Qualified', value: data?.qualified || 0 },
        { name: 'Won', value: data?.won || 0 },
        { name: 'Lost', value: data?.lost || 0 },
    ].filter(d => d.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400">
                No lead data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`${value} leads`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

// Leads by Assignee Bar Chart
export function LeadsByAssigneeChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400">
                No assignee data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                    dataKey="leads"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    name="Leads"
                />
                <Bar
                    dataKey="inquiries"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    name="Inquiries"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

// Inquiry Status Pie Chart
export function InquiryStatusChart({ data }) {
    const chartData = [
        { name: 'New', value: data?.newCount || 0 },
        { name: 'Contacted', value: data?.contactedCount || 0 },
        { name: 'Resolved', value: data?.resolvedCount || 0 },
        { name: 'Converted', value: data?.convertedCount || 0 },
    ].filter(d => d.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400">
                No inquiry data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

// Conversion Rate Summary
export function ConversionRateCard({ inquiryStats, leadStats }) {
    const totalInquiries = inquiryStats?.total || 0;
    const convertedInquiries = inquiryStats?.convertedCount || 0;
    const conversionRate = totalInquiries > 0 ? ((convertedInquiries / totalInquiries) * 100).toFixed(1) : 0;

    const totalLeads = leadStats?.total || 0;
    const wonLeads = leadStats?.won || 0;
    const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

    const metrics = [
        { label: 'Inquiry → Lead', value: conversionRate, count: convertedInquiries, total: totalInquiries },
        { label: 'Lead Win Rate', value: winRate, count: wonLeads, total: totalLeads },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {metrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                            <circle
                                cx="18" cy="18" r="14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-slate-100 dark:text-slate-700"
                            />
                            <circle
                                cx="18" cy="18" r="14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${metric.value * 0.88} 88`}
                                strokeLinecap="round"
                                className="text-brand-600 dark:text-brand-400"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {metric.value}%
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{metric.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{metric.count} of {metric.total}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Revenue Trend Line Chart
export function RevenueTrendChart({ data }) {
    const chartData = data || [];
    const hasData = chartData.length > 0 && chartData.some(d => d.revenue > 0);

    if (!hasData) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                No revenue data yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                />
                <Tooltip
                    formatter={(value) => [`Rs.${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#4f46e5' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
