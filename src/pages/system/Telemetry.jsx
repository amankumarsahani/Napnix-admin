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

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// Helper to parse SQLite UTC strings safely into local JS Date objects
const parseSqliteDate = (dateStr) => {
    if (!dateStr) return new Date();
    return new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
};

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
        const appVersions = {};
        
        let totalKnownEmails = 0;
        let totalTenants = 0;

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

            // App Versions
            const appVer = `${device.platform === 'web' ? 'Web' : 'App'} v${device.app_version} (b${device.build_number})`;
            appVersions[appVer] = (appVersions[appVer] || 0) + 1;

            // Daily Active
            if (device.last_seen_at) {
                const date = parseSqliteDate(device.last_seen_at).toLocaleDateString();
                dailyActive[date] = (dailyActive[date] || 0) + 1;
            }

            // Emails & Tenants
            if (device.emails && device.emails.length > 0) {
                totalKnownEmails += device.emails.length;
                device.emails.forEach(email => {
                    if (device.tenants && device.tenants[email]) {
                        totalTenants += device.tenants[email].length;
                    }
                });
            }
        });

        const platformChart = Object.entries(platforms)
            .filter(([_, val]) => val > 0)
            .map(([name, value]) => ({ name: name.toUpperCase(), value }));

        const versionChart = Object.entries(appVersions)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const osChart = Object.entries(osVersions)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const dailyChart = Object.entries(dailyActive)
            .map(([date, active]) => ({ date, active }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-7); // Last 7 days

        return { platformChart, versionChart, osChart, dailyChart, totalKnownEmails, totalTenants };
    }, [data]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-brand-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-slate-500 font-medium">Synchronizing telemetry nodes...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                    <FiActivity size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connection Failed</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">Unable to securely communicate with the registry microservice. Ensure the API key is correct and the server is running.</p>
                <button onClick={() => refetch()} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors">
                    Retry Connection
                </button>
            </div>
        );
    }

    const { platformChart, versionChart, osChart, dailyChart, totalKnownEmails, totalTenants } = parsedData;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Telemetry 
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md">Live</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Real-time cross-platform device synchronization & metrics.</p>
                </div>
                <button 
                    onClick={() => refetch()} 
                    disabled={isFetching}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw className={`${isFetching ? 'animate-spin text-brand-500' : 'text-slate-400'}`} />
                    <span>{isFetching ? 'Syncing...' : 'Force Sync'}</span>
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Total Devices', value: data.total_devices || 0, icon: <FiSmartphone />, color: 'indigo' },
                    { title: 'Identified Users', value: totalKnownEmails, icon: <FiUsers />, color: 'emerald' },
                    { title: 'Active Tenants', value: totalTenants, icon: <FiMonitor />, color: 'amber' },
                    { title: 'Avg Tenants / User', value: totalKnownEmails ? (totalTenants / totalKnownEmails).toFixed(1) : 0, icon: <FiCpu />, color: 'rose' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value.toLocaleString()}</h3>
                            </div>
                            <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-lg flex items-center justify-center text-lg`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:border-brand-500/30 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-brand-500 rounded-full"></div>
                        Platform Distribution
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformChart}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {platformChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* App Versions */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:border-emerald-500/30 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                        Version Fragmentation
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={versionChart}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {versionChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Active Devices */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:border-rose-500/30 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
                        Active Devices (7 Days)
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="active" 
                                    name="Active Devices"
                                    stroke="#f43f5e" 
                                    strokeWidth={5} 
                                    dot={{ fill: '#f43f5e', strokeWidth: 3, r: 6, stroke: '#ffffff' }} 
                                    activeDot={{ r: 9, strokeWidth: 0, fill: '#e11d48' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Devices Table with Tenants */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/10 dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FiActivity className="text-brand-500" />
                        Live Device Stream
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/80">
                                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Device Identity</th>
                                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Client</th>
                                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[40%]">Users & Linked Tenants</th>
                                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Last Ping</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {data.devices?.map((device, i) => (
                                <tr key={i} className="hover:bg-brand-50/30 dark:hover:bg-slate-800/80 transition-colors group">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-600">
                                                {device.platform?.toLowerCase().includes('ios') || device.platform?.toLowerCase().includes('android') ? <FiSmartphone size={22} /> : <FiMonitor size={22} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm font-mono tracking-tight bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block mb-1">{device.device_id?.split('-')[0]}...</p>
                                                <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{device.device_model}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                device.platform?.toLowerCase().includes('ios') ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                device.platform?.toLowerCase().includes('android') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                                'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400'
                                            }`}>
                                                {device.platform}
                                            </span>
                                            <p className="text-xs font-bold text-slate-500 ml-1">v{device.app_version} <span className="font-normal opacity-70">(b{device.build_number})</span></p>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        {device.emails && device.emails.length > 0 ? (
                                            <div className="space-y-3">
                                                {device.emails.map(email => (
                                                    <div key={email} className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {email}
                                                            </span>
                                                        </div>
                                                        {device.tenants && device.tenants[email] ? (
                                                            <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-slate-100 dark:border-slate-700">
                                                                {device.tenants[email].map(t => (
                                                                    <div key={t.slug} className="flex flex-col bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                            {t.name}
                                                                        </span>
                                                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                                                            {t.industry}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-400 pl-4 italic">No active tenants linked.</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold text-slate-500 italic uppercase tracking-wider">Anonymous Device</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-5 px-6 text-right align-top">
                                        <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg inline-flex">
                                            <FiClock className="w-4 h-4 text-brand-500" />
                                            {parseSqliteDate(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 mr-1 font-medium">
                                            {parseSqliteDate(device.last_seen_at).toLocaleDateString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {(!data.devices || data.devices.length === 0) && (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                                        No telemetry nodes active in this cluster.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
