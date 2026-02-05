import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';
import {
    FiBarChart2, FiUsers, FiSettings, FiBriefcase, FiZap, FiFileText,
    FiMail, FiMessageCircle, FiLayout, FiCreditCard, FiActivity, FiSearch, FiLayers,
    FiServer, FiHardDrive, FiChevronDown, FiChevronRight, FiGrid, FiPlus, FiXCircle
} from '../icons/FeatherIcons';

export default function Sidebar({ isOpen, setIsOpen }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState(['main-menu', 'infrastructure']);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMenu = (menu) => {
        setOpenMenus(prev =>
            prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
        );
    };

    const navSections = [
        {
            title: 'Main Menu',
            id: 'main-menu',
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: <FiBarChart2 />, roles: ['admin', 'sales_operator'] },
                { name: 'Tenants', path: '/tenants', icon: <FiLayers />, roles: ['admin'] },
                { name: 'Clients', path: '/clients', icon: <FiUsers />, roles: ['admin', 'user'] },
                { name: 'Projects', path: '/projects', icon: <FiBriefcase />, roles: ['admin', 'user'] },
                { name: 'Leads', path: '/leads', icon: <FiZap />, roles: ['admin', 'sales_operator'], badge: 'NEW' },
            ]
        },
        {
            title: 'Communication',
            id: 'comm-menu',
            items: [
                { name: 'Inquiries', path: '/inquiries', icon: <FiMail />, roles: ['admin', 'sales_operator'] },
                { name: 'Campaigns', path: '/campaigns', icon: <FiMessageCircle />, roles: ['admin'] },
                { name: 'Workflows', path: '/workflows', icon: <FiActivity />, roles: ['admin'] },
                { name: 'Blogs', path: '/blogs', icon: <FiFileText />, roles: ['admin'] },
            ]
        },
        {
            title: 'Infrastructure',
            id: 'infrastructure',
            items: [
                { name: 'Servers', path: '/infrastructure/servers', icon: <FiServer />, roles: ['admin'] },
                { name: 'Backups', path: '/infrastructure/backups', icon: <FiHardDrive />, roles: ['admin'] },
            ]
        },
        {
            title: 'System',
            id: 'system-menu',
            items: [
                { name: 'Documents', path: '/documents', icon: <FiFileText />, roles: ['admin', 'sales_operator'] },
                { name: 'Templates', path: '/templates', icon: <FiLayout />, roles: ['admin'] },
                { name: 'Transactions', path: '/transactions', icon: <FiCreditCard />, roles: ['admin'] },
                { name: 'Settings', path: '/settings', icon: <FiSettings />, roles: ['admin'] },
                { name: 'Team', path: '/team', icon: <FiUsers />, roles: ['admin'] },
            ]
        }
    ];

    const isVisible = (roles) => !roles || roles.includes(user?.role || 'user');

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                {/* Header */}
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20 text-white">
                                <FiZap size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nexspire</h1>
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">Enterprise</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <FiXCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
                    {navSections.map((section) => (
                        <div key={section.title} className="mb-6">
                            <button
                                onClick={() => toggleMenu(section.id)}
                                className="w-full flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 hover:text-indigo-500 transition-colors"
                            >
                                {section.title}
                                {openMenus.includes(section.id) ? <FiChevronDown /> : <FiChevronRight />}
                            </button>

                            {openMenus.includes(section.id) && (
                                <div className="space-y-1">
                                    {section.items.filter(item => isVisible(item.roles)).map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                                }`
                                            }
                                        >
                                            <div className="text-lg">
                                                {item.icon}
                                            </div>
                                            <span className="text-sm font-medium">{item.name}</span>
                                            {item.badge && (
                                                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer - Theme Toggle & Logout */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
                    >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <div className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 ${isDark ? 'left-7' : 'left-0.5'}`}>
                                {isDark ? '🌙' : '☀️'}
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}
