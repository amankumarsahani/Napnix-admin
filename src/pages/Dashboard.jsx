import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminStatsSection from '../components/charts/AdminStatsSection';
import { dashboardAPI } from '../api';

// Mock data removed - fetching from API

export default function Dashboard() {
    const { user } = useAuth();

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => dashboardAPI.getStats(),
    });

    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['dashboard-recent-activity'],
        queryFn: () => dashboardAPI.getRecentActivity(),
    });

    const isLoading = statsLoading || activityLoading;

    const stats = statsData ? [
        {
            label: 'Total Revenue',
            value: `Rs.${(statsData.revenue || 0).toLocaleString()}`,
            change: '+0%',
            isPositive: true,
            icon: 'dollar'
        },
        {
            label: 'Active Projects',
            value: statsData.activeProjects || 0,
            change: '+0',
            isPositive: true,
            icon: 'briefcase'
        },
        {
            label: 'New Leads',
            value: statsData.newLeads || 0,
            change: `${statsData.totalLeads || 0} Total`,
            isPositive: true,
            icon: 'users'
        },
        {
            label: 'Pending Inquiries',
            value: statsData.pendingInquiries || 0,
            change: 'Action Needed',
            isPositive: false,
            icon: 'inbox'
        },
    ] : [];

    const recentLeads = activityData?.recentLeads || [];

    const getIcon = (type) => {
        switch (type) {
            case 'dollar':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
            case 'briefcase':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
            case 'users':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
            case 'inbox':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />;
            default:
                return null;
        }
    };

    // Filter stats based on role
    const getStats = () => {
        const role = user?.role || 'employee';

        switch (role) {
            case 'admin':
                return stats; // See everything
            case 'manager':
                return stats.slice(0, 3); // Hide Pending Inquiries (Admin only)
            default: // Employee
                return [
                    { label: 'My Tasks', value: '12', change: '-2', isPositive: true, icon: 'briefcase' },
                    { label: 'Pending Reviews', value: '4', change: '+1', isPositive: false, icon: 'inbox' }
                ];
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const currentStats = getStats();

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Welcome back, <span className="text-brand-600 dark:text-brand-400">{user?.firstName || 'User'}</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 capitalize">Role: {user?.role || 'employee'} • Here's what's happening today.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentStats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${stat.isPositive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                            }`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {getIcon(stat.icon)}
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{stat.label}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.isPositive ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'
                                }`}>
                                {stat.isPositive ? '↑' : '↓'} {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Charts Section - Admin sees all, Sales Operator sees their own */}
            {['admin', 'sales_operator'].includes(user?.role) && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                        {user?.role === 'admin' ? 'Analytics Overview' : 'My Performance'}
                    </h2>
                    <AdminStatsSection />
                </div>
            )}

            {/* Recent Leads Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Leads</h2>
                    <Link to="/leads" className="text-sm text-brand-600 font-semibold hover:text-brand-700">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                                <th className="pb-3 pl-2">Contact</th>
                                <th className="pb-3">Value</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right pr-2">Heat Score</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {recentLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0">
                                    <td className="py-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                {lead.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">{lead.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{lead.company}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 font-medium text-slate-600 dark:text-slate-300">
                                        Rs.{Number(lead.value || lead.estimatedValue || 0).toLocaleString()}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lead.status?.toLowerCase() === 'new' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
                                            lead.status?.toLowerCase() === 'negotiation' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' :
                                                'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            } capitalize`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${lead.score > 80 ? 'bg-emerald-500' : lead.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${lead.score}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{lead.score}</span>
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
