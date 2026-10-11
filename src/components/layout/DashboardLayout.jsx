import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { FiMenu, FiSearch, FiSettings, FiLogOut, FiSun, FiMoon, FiMonitor, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar, Menu } from '../ui';
import Sidebar from './Sidebar';
import CommandPalette from '../common/CommandPalette';
import { findNavItem } from './navConfig';

const roleLabel = role => (role ? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Admin');

function UserMenu() {
    const { user, logout } = useAuth();
    const { preference, setTheme } = useTheme();
    const navigate = useNavigate();
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Admin';

    return (
        <Menu
            label="Account menu"
            buttonClassName="flex items-center gap-2 rounded-sm px-1.5 h-9 hover:bg-surface-2"
            trigger={
                <>
                    <Avatar name={name} />
                    <span className="hidden md:block text-left leading-tight">
                        <span className="block text-sm font-medium text-fg">{user?.firstName || 'Admin'}</span>
                        <span className="block text-2xs text-fg-subtle">{roleLabel(user?.role)}</span>
                    </span>
                </>
            }
            items={[
                { header: <><p className="text-sm font-medium text-fg">{name}</p><p className="text-xs text-fg-subtle">{user?.email}</p></> },
                ...(user?.role === 'admin' ? [{ label: 'Settings', icon: <FiSettings className="size-4" />, onSelect: () => navigate('/settings') }] : []),
                { label: 'Light theme', icon: <FiSun className="size-4" />, checked: preference === 'light', onSelect: () => setTheme('light'), separatorBefore: true },
                { label: 'Dark theme', icon: <FiMoon className="size-4" />, checked: preference === 'dark', onSelect: () => setTheme('dark') },
                { label: 'Match system', icon: <FiMonitor className="size-4" />, checked: preference === 'system', onSelect: () => setTheme('system') },
                { label: 'Log out', icon: <FiLogOut className="size-4" />, danger: true, separatorBefore: true, onSelect: () => { logout(); navigate('/login'); } },
            ]}
        />
    );
}

export default function DashboardLayout() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const mainRef = useRef(null);
    const navItem = findNavItem(location.pathname);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // New page starts at the top (main is the scroll container, not the window)
    useEffect(() => { mainRef.current?.scrollTo(0, 0); }, [location.pathname]);

    useEffect(() => {
        document.title = navItem ? `${navItem.crumb || navItem.name} · Napnix Admin` : 'Napnix Admin';
    }, [navItem]);

    return (
        <div className="flex h-dvh bg-canvas text-fg">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center gap-3 h-[52px] shrink-0 px-4 lg:px-6 bg-surface border-b border-border">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation"
                        aria-expanded={sidebarOpen}
                        aria-controls="app-sidebar"
                        className="lg:hidden -ml-1.5 p-1.5 rounded-sm text-fg-muted hover:bg-surface-2"
                    >
                        <FiMenu className="size-5" />
                    </button>

                    <nav aria-label="Breadcrumb" className="min-w-0">
                        <ol className="flex items-center gap-1.5 text-sm">
                            {navItem && (
                                <>
                                    <li className="hidden sm:block text-fg-subtle">{navItem.group}</li>
                                    <li aria-hidden="true" className="hidden sm:block text-fg-subtle"><FiChevronRight className="size-3.5" /></li>
                                    <li className="font-medium text-fg truncate" aria-current="page">{navItem.crumb || navItem.name}</li>
                                </>
                            )}
                        </ol>
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCommandPaletteOpen(true)}
                            aria-label="Search pages (Ctrl+K)"
                            className="flex items-center gap-2 h-8 rounded-sm border border-border bg-surface-2 px-2.5 text-sm text-fg-subtle hover:text-fg hover:border-border-strong sm:w-56"
                        >
                            <FiSearch aria-hidden="true" className="size-4" />
                            <span className="hidden sm:inline">Search pages</span>
                            <kbd className="hidden sm:inline ml-auto font-mono text-2xs px-1.5 rounded-sm border border-border text-fg-subtle">⌘K</kbd>
                        </button>
                        <UserMenu />
                    </div>
                </header>

                <main ref={mainRef} className="flex-1 overflow-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        </div>
    );
}
