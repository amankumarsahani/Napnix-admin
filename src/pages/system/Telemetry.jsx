import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    FiActivity, FiSmartphone, FiMonitor, 
    FiRefreshCw, FiClock, FiUsers, FiCpu 
} from '../../components/icons/FeatherIcons';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { telemetryAdminAPI } from '../../api/admin';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-sm font-bold text-slate-300 mb-1">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.name}: <span className="font-bold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function Telemetry() {
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['telemetry-stats'],
        queryFn: telemetryAdminAPI.getStats,
        refetchInterval: 30000 // auto refresh every 30s
    });

    const parsedData = useMemo(() => {
        if (!data?.devices) return null;

        const platforms = { ios: 0, android: 0, web: 0, other: 0 };
        const osVersions = {};
        const dailyActive = {};
        
        let totalKnownEmails = 0;

        data.devices.forEach(device => {
            // Platform
            const plat = (device.platform || '').toLowerCase();
            if (plat.includes('ios')) platforms.ios++;
            else if (plat.includes('android')) platforms.android++;
            else if (plat.includes('web')) platforms.web++;
            else platforms.other++;

            // OS Version
            const os = device.os_version || 'Unknown';
            osVersions[os] = (osVersions[os] || 0) + 1;

            // Daily Active
            if (device.last_seen_at) {
                const date = new Date(device.last_seen_at).toLocaleDateString();
                dailyActive[date] = (dailyActive[date] || 0) + 1;
            }

            if (device.emails && device.emails.length > 0) {
                totalKnownEmails++;
            }
        });

        const platformChart = Object.entries(platforms)
            .filter(([_, val]) => val > 0)
            .map(([name, value]) => ({ name: name.toUpperCase(), value }));

        const osChart = Object.entries(osVersions)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const dailyChart = Object.entries(dailyActive)
            .map(([date, active]) => ({ date, active }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-7); // Last 7 days

        return { platformChart, osChart, dailyChart, totalKnownEmails };
    }, [data]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-slate-500 font-medium">Synchronizing telemetry nodes...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                    <FiActivity size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connection Failed</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">Unable to securely communicate with the registry microservice. Ensure the API key is correct and the server is running.</p>
                <button onClick={() => refetch()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30">
                    Retry Connection
                </button>
            </div>
        );
    }

    const { platformChart, osChart, dailyChart, totalKnownEmails } = parsedData;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Telemetry 
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold rounded-lg uppercase tracking-wider">Live</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Real-time cross-platform device synchronization & metrics.</p>
                </div>
                <button 
                    onClick={() => refetch()} 
                    disabled={isFetching}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
                >
                    <FiRefreshCw className={isFetching ? 'animate-spin text-indigo-500' : 'text-slate-400'} />
                    {isFetching ? 'Syncing...' : 'Force Sync'}
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Total Devices', value: data.total_devices || 0, icon: <FiSmartphone />, color: 'indigo' },
                    { title: 'Identified Users', value: totalKnownEmails, icon: <FiUsers />, color: 'emerald' },
                    { title: 'Data Packets', value: data.stats?.[0]?.total_pings || 0, icon: <FiActivity />, color: 'amber' },
                    { title: 'Avg Ping/Device', value: Math.round((data.stats?.[0]?.total_pings || 0) / (data.total_devices || 1)), icon: <FiCpu />, color: 'rose' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${stat.color}-500/10 rounded-full blur-2xl group-hover:bg-${stat.color}-500/20 transition-all duration-500`}></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stat.value.toLocaleString()}</h3>
                            </div>
                            <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 rounded-xl flex items-center justify-center text-xl`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Platform Distribution</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformChart}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {platformChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Active Devices */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Active Devices (7 Days)</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="active" 
                                    name="Active Devices"
                                    stroke="#4f46e5" 
                                    strokeWidth={4} 
                                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 6, stroke: '#ffffff' }} 
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* OS Versions */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Operating Systems</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={osChart} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.1 }} />
                                <Bar dataKey="value" name="Devices" fill="#10b981" radius={[0, 8, 8, 0]}>
                                    {osChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Devices Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Telemetry Streams</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Device ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Platform</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">App Version</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Known Identity</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Last Ping</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {data.devices?.slice(0, 10).map((device, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                {device.platform?.toLowerCase().includes('ios') || device.platform?.toLowerCase().includes('android') ? <FiSmartphone /> : <FiMonitor />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{device.device_id?.split('-')[0]}...</p>
                                                <p className="text-xs text-slate-500 font-medium">{device.device_model}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                            device.platform?.toLowerCase().includes('ios') ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                            device.platform?.toLowerCase().includes('android') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        }`}>
                                            {device.platform}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">v{device.app_version}</p>
                                        <p className="text-xs text-slate-500">Build {device.build_number}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        {device.emails && device.emails.length > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                                                {device.emails[0]}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-slate-400 italic">Anonymous</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-500">
                                            <FiClock className="w-4 h-4" />
                                            {new Date(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
