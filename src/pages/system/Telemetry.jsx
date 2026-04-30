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
                const date = new Date(device.last_seen_at).toLocaleDateString();
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

    const { platformChart, versionChart, osChart, dailyChart, totalKnownEmails, totalTenants } = parsedData;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Telemetry 
                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-xs font-black rounded-lg uppercase tracking-widest shadow-lg shadow-emerald-500/30">Live</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Real-time cross-platform device synchronization & metrics.</p>
                </div>
                <button 
                    onClick={() => refetch()} 
                    disabled={isFetching}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-indigo-500/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <FiRefreshCw className={`relative z-10 ${isFetching ? 'animate-spin text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'}`} />
                    <span className="relative z-10">{isFetching ? 'Syncing...' : 'Force Sync'}</span>
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
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className={`absolute -right-6 -top-6 w-32 h-32 bg-${stat.color}-500/10 rounded-full blur-2xl group-hover:bg-${stat.color}-500/20 transition-all duration-500`}></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.title}</p>
                                <h3 className="text-5xl font-black text-slate-900 dark:text-white drop-shadow-sm">{stat.value.toLocaleString()}</h3>
                            </div>
                            <div className={`w-14 h-14 bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 dark:from-${stat.color}-900/40 dark:to-${stat.color}-800/20 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-${stat.color}-200 dark:border-${stat.color}-800/50`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:border-indigo-500/30 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:border-emerald-500/30 transition-colors">
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
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:border-rose-500/30 transition-colors">
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/10 dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FiActivity className="text-indigo-500" />
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
                                <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/80 transition-colors group">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200 dark:border-slate-600 group-hover:scale-110 transition-transform">
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
                                                'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
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
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
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
                                            <FiClock className="w-4 h-4 text-indigo-500" />
                                            {new Date(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 mr-1 font-medium">
                                            {new Date(device.last_seen_at).toLocaleDateString()}
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
