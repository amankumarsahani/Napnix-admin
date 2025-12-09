import { useState, useEffect } from 'react';
import { clientsAPI, projectsAPI, leadsAPI } from '../api';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [stats, setStats] = useState({
        clients: { total: 0, active: 0 },
        projects: { total: 0, inProgress: 0 },
        leads: { total: 0, qualified: 0 },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [clientsData, projectsData, leadsData] = await Promise.all([
                clientsAPI.getStats(),
                projectsAPI.getStats(),
                leadsAPI.getStats(),
            ]);

            setStats({
                clients: clientsData,
                projects: projectsData,
                leads: leadsData,
            });
        } catch (error) {
            toast.error('Failed to load statistics');
            console.error('Stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Clients',
            value: stats.clients.total || 0,
            subtitle: `${stats.clients.active || 0} active`,
            trend: '+12%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconBg: 'bg-blue-500',
        },
        {
            title: 'Active Projects',
            value: stats.projects.total || 0,
            subtitle: `${stats.projects.inProgress || 0} in progress`,
            trend: '+8%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'purple',
            bgColor: 'bg-purple-50',
            iconBg: 'bg-purple-500',
        },
        {
            title: 'Total Leads',
            value: stats.leads.total || 0,
            subtitle: `${stats.leads.qualified || 0} qualified`,
            trend: '+23%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            color: 'green',
            bgColor: 'bg-green-50',
            iconBg: 'bg-green-500',
        },
        {
            title: 'Revenue',
            value: '$124K',
            subtitle: 'This month',
            trend: '+18%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'orange',
            bgColor: 'bg-orange-50',
            iconBg: 'bg-orange-500',
        },
    ];

    const quickActions = [
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            label: 'Add Client',
            color: 'blue',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            label: 'New Project',
            color: 'purple',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            label: 'Add Lead',
            color: 'green',
        },
    ];

    const recentActivity = [
        { icon: '👥', action: 'New client added', detail: 'Tech Innovations Inc', time: '2 hours ago' },
        { icon: '📁', action: 'Project updated', detail: 'Website Redesign', time: '5 hours ago' },
        { icon: '💼', action: 'Lead converted', detail: 'Marketing Pro Ltd', time: '1 day ago' },
        { icon: '✅', action: 'Project completed', detail: 'Mobile App Development', time: '2 days ago' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
                <p className="text-blue-100">Here's what's happening with your business today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                                <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                                    {card.icon}
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${card.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {card.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-600 text-sm font-medium mb-1">{card.title}</h3>
                        <p className="text-3xl font-bold text-slate-900 mb-1">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.subtitle}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className={`w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left`}
                            >
                                <div className={`w-8 h-8 bg-${action.color}-100 text-${action.color}-600 rounded-lg flex items-center justify-center`}>
                                    {action.icon}
                                </div>
                                <span className="font-medium text-sm text-slate-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentActivity.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <div className="text-2xl">{item.icon}</div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-slate-900">{item.action}</p>
                                    <p className="text-xs text-slate-600">{item.detail}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
