import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('dashboard')) return 'Dashboard';
        if (path.includes('clients')) return 'Clients';
        if (path.includes('projects')) return 'Projects';
        if (path.includes('leads')) return 'Leads';
        return 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 z-10 sticky top-0 shadow-sm">
                    <div className="flex items-center justify-between">
                        {/* Left: Hamburger + Title */}
                        <div className="flex items-center gap-4">
                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h1>
                            </div>
                        </div>

                        {/* Right: Search & Notifications & User */}
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <div className="relative hidden md:block group">
                                <input
                                    type="text"
                                    placeholder="Search command..."
                                    className="w-72 pl-11 pr-4 py-2 bg-slate-100 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-brand-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                                />
                                <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Notifications */}
                            <button className="relative p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                            </button>

                            {/* User Avatar */}
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-semibold text-slate-800">{user?.firstName || 'Admin'}</p>
                                    <p className="text-xs text-slate-500">Super Admin</p>
                                </div>
                                <button className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center border border-brand-200">
                                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6 bg-brand-50/50 scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
