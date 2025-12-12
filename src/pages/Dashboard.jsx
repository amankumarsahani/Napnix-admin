import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

// Mock data (replace with API calls later)
const stats = [
    { label: 'Total Revenue', value: '$124,500', change: '+12.5%', isPositive: true, icon: 'dollar' },
    { label: 'Active Projects', value: '12', change: '+2', isPositive: true, icon: 'briefcase' },
    { label: 'New Leads', value: '45', change: '+5.2%', isPositive: true, icon: 'users' },
    { label: 'Pending Inquiries', value: '8', change: '-2', isPositive: false, icon: 'inbox' },
];

const recentLeads = [
    { id: 1, name: 'Alice Freeman', company: 'TechCorp', status: 'New', value: '$5,000', score: 85 },
    { id: 2, name: 'Robert Smith', company: 'Design Studio', status: 'Negotiation', value: '$12,000', score: 92 },
    { id: 3, name: 'Sarah Jones', company: 'Retail Inc', status: 'Contacted', value: '$3,500', score: 60 },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setIsLoading(false), 800);
    }, []);

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

    // Filter quick actions based on role
    const getQuickActions = () => {
        const role = user?.role || 'employee';
        const actions = [
            { id: 1, label: 'Add Lead', icon: 'M12 4v16m8-8H4', color: 'brand', roles: ['admin', 'manager', 'employee'] },
            { id: 2, label: 'Create Invoice', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'purple', roles: ['admin', 'manager'] },
            { id: 3, label: 'Send Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'blue', roles: ['admin', 'manager', 'employee'] },
            { id: 4, label: 'New Task', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'emerald', roles: ['admin', 'manager'] }
        ];
        return actions.filter(action => action.roles.includes(role));
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                <div className="h-20 bg-slate-200 rounded-2xl w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
                    <div className="h-96 bg-slate-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    const currentStats = getStats();
    const currentActions = getQuickActions();
    const canViewRevenue = ['admin', 'manager'].includes(user?.role || 'employee');
    const canViewLeads = true; // Everyone can see leads they have access to (backend handles filtering normally, frontend mocks here)

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back, <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">{user?.firstName || 'User'}</span>
                    </h1>
                    <p className="text-slate-500 mt-1 capitalize">Role: {user?.role || 'employee'} • Here's what's happening today.</p>
                </div>
                {['admin', 'manager'].includes(user?.role) && (
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm">
                            Download Report
                        </button>
                        <button className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30">
                            + New Project
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentStats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
                        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${stat.isPositive ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-pink-500'}`} />
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity transform translate-x-2 -translate-y-2">
                            <svg className={`w-28 h-28 ${stat.isPositive ? 'text-emerald-500' : 'text-rose-500'} transform -rotate-12`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {getIcon(stat.icon)}
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110 ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {getIcon(stat.icon)}
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                    {stat.isPositive ? '↑' : '↓'} {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Revenue & Leads */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Revenue - Admin/Manager Only */}
                    {canViewRevenue && (
                        <div className="glass-panel p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-800">Revenue Overview</h2>
                                <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-1 outline-none">
                                    <option>This Year</option>
                                    <option>Last Year</option>
                                </select>
                            </div>
                            <div className="h-64 flex items-end justify-between gap-2 px-4">
                                {/* Mock Bar Chart */}
                                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                    <div key={i} className="w-full bg-brand-100 rounded-t-lg relative group h-full flex flex-col justify-end">
                                        <div
                                            style={{ height: `${h}%` }}
                                            className="w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t-lg opacity-80 group-hover:opacity-100 transition-all duration-300 relative"
                                        >
                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                ${h}k
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                    <span key={m}>{m}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Projects/Leads Table */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Recent Leads</h2>
                            <Link to="/leads" className="text-sm text-brand-600 font-semibold hover:text-brand-700">View All</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="pb-3 pl-2">Contact</th>
                                        <th className="pb-3">Value</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right pr-2">Heat Score</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {recentLeads.map((lead) => (
                                        <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                            <td className="py-4 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {lead.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{lead.name}</p>
                                                        <p className="text-xs text-slate-500">{lead.company}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 font-medium text-slate-600">{lead.value}</td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                                                    lead.status === 'Negotiation' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-2">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${lead.score > 80 ? 'bg-emerald-500' : lead.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${lead.score}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="font-bold text-slate-700">{lead.score}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Notifications & Quick Actions */}
                <div className="space-y-8">
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {currentActions.map(action => (
                                <button key={action.id} className="p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all group flex flex-col items-center justify-center gap-2 text-center">
                                    <div className={`w-10 h-10 rounded-full bg-${action.color}-100 text-${action.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                        </svg>
                                    </div>
                                    <span className={`text-xs font-semibold text-slate-600 group-hover:text-${action.color}-700`}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Pending Tasks</h2>
                        <div className="space-y-4">
                            {[
                                { title: 'Review detailed project proposal', time: '2h ago', urgent: true },
                                { title: 'Call with TechCorp regarding contract', time: '4h ago', urgent: false },
                                { title: 'Update website content for Q1', time: 'Yesterday', urgent: false },
                            ].map((task, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                    <div className="mt-1">
                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-600 transition-colors cursor-pointer">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-400">{task.time}</span>
                                            {task.urgent && <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">URGENT</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
