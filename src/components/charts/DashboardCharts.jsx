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

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Inquiry → Lead</p>
                <p className="text-3xl font-bold text-indigo-700">{conversionRate}%</p>
                <p className="text-sm text-slate-500 mt-1">{convertedInquiries} of {totalInquiries}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Lead Win Rate</p>
                <p className="text-3xl font-bold text-emerald-700">{winRate}%</p>
                <p className="text-sm text-slate-500 mt-1">{wonLeads} of {totalLeads}</p>
            </div>
        </div>
    );
}

// Revenue Trend Line Chart
export function RevenueTrendChart({ data }) {
    // Mock data if not provided
    const chartData = data || [
        { month: 'Jan', revenue: 4000 },
        { month: 'Feb', revenue: 3000 },
        { month: 'Mar', revenue: 5000 },
        { month: 'Apr', revenue: 4500 },
        { month: 'May', revenue: 6000 },
        { month: 'Jun', revenue: 5500 },
    ];

    return (
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
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
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
