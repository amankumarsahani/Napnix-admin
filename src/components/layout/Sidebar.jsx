import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiChevronDown, FiChevronsLeft, FiChevronsRight, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { inquiriesAPI, supportAPI } from '../../api';
import { cx } from '../ui';
import { navForRole } from './navConfig';

// Live counters for nav items with `count`. Support reuses SupportInbox's default query key,
// so opening the inbox and the badge share one cached request.
function useNavCounts(role) {
    const isAdmin = role === 'admin';
    const canInquiries = isAdmin || role === 'sales_operator';
    const support = useQuery({
        queryKey: ['support-tickets', { status: '', priority: '', search: '' }],
        queryFn: () => supportAPI.listTickets({ status: '', priority: '', search: '' }),
        staleTime: 2 * 60 * 1000,
        enabled: isAdmin,
    });
    const inquiries = useQuery({
        queryKey: ['inquiries', 'stats'],
        queryFn: () => inquiriesAPI.getStats(),
        staleTime: 2 * 60 * 1000,
        enabled: canInquiries,
    });
    return {
        support: Number(support.data?.stats?.active) || 0,
        inquiries: Number(inquiries.data?.data?.newCount) || 0,
    };
}

// Below lg the sidebar is an off-canvas drawer; it must be inert while hidden
function useIsDesktop() {
    const query = '(min-width: 1024px)';
    const [desktop, setDesktop] = useState(() => window.matchMedia?.(query).matches ?? true);
    useEffect(() => {
        const mq = window.matchMedia?.(query);
        if (!mq) return undefined;
        const onChange = e => setDesktop(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return desktop;
}

const readCollapsed = () => {
    try { return localStorage.getItem('sidebar-collapsed') === '1'; } catch { return false; }
};

export default function Sidebar({ isOpen, setIsOpen }) {
    const { user } = useAuth();
    const groups = navForRole(user?.role);
    const counts = useNavCounts(user?.role);
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [closedGroups, setClosedGroups] = useState([]);
    const asideRef = useRef(null);
    const isDesktop = useIsDesktop();

    useEffect(() => {
        try { localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0'); } catch { /* private mode */ }
    }, [collapsed]);

    // Mobile drawer: focus in, Esc closes, Tab stays inside
    useEffect(() => {
        if (!isOpen) return undefined;
        const aside = asideRef.current;
        aside?.querySelector('a, button')?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key !== 'Tab' || !aside) return;
            const els = [...aside.querySelectorAll('a[href], button:not([disabled])')].filter(el => el.offsetParent !== null);
            const first = els[0], last = els[els.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, setIsOpen]);

    const toggleGroup = id => setClosedGroups(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]));
    const rail = collapsed && isDesktop; // icon rail on desktop only; the mobile drawer is always full width

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsOpen(false)} aria-hidden="true" />}

            <aside
                ref={asideRef}
                id="app-sidebar"
                aria-label="Main navigation"
                inert={!isDesktop && !isOpen}
                className={cx(
                    'fixed inset-y-0 left-0 z-40 flex flex-col w-60 bg-surface-2 border-r border-border',
                    'transition-transform duration-[180ms] lg:static lg:translate-x-0 lg:transition-[width]',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    rail && 'lg:w-14'
                )}
            >
                <div className={cx('flex items-center h-[52px] px-4 border-b border-border', rail && 'lg:justify-center lg:px-0')}>
                    <NavLink to="/dashboard" className="flex items-center gap-2.5 min-w-0" aria-label="Napnix admin home">
                        <img src="/napnix-mark.png" alt="" width="28" height="28" className="size-7 shrink-0" />
                        <span className={cx('text-base font-semibold text-fg', rail && 'lg:hidden')}>Napnix</span>
                    </NavLink>
                    <button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation"
                        className="ml-auto p-1.5 rounded-sm text-fg-muted hover:bg-surface-3 lg:hidden">
                        <FiX className="size-4" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2">
                    {groups.map(group => {
                        const groupOpen = rail || !closedGroups.includes(group.id);
                        return (
                            <div key={group.id} className="mb-3">
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.id)}
                                    aria-expanded={groupOpen}
                                    className={cx(
                                        'w-full flex items-center justify-between px-2 h-7 rounded-sm',
                                        'text-2xs font-semibold uppercase tracking-wider text-fg-subtle hover:text-fg',
                                        rail && 'lg:hidden'
                                    )}
                                >
                                    {group.title}
                                    <FiChevronDown aria-hidden="true" className={cx('size-3.5 transition-transform', !groupOpen && '-rotate-90')} />
                                </button>
                                {groupOpen && (
                                    <ul className="space-y-px">
                                        {group.items.map(item => {
                                            const Icon = item.icon;
                                            const count = item.count ? counts[item.count] : 0;
                                            return (
                                                <li key={item.path}>
                                                    <NavLink
                                                        to={item.path}
                                                        end={item.end}
                                                        onClick={() => setIsOpen(false)}
                                                        title={rail ? item.name : undefined}
                                                        aria-label={rail && count ? `${item.name} (${count})` : undefined}
                                                        className={({ isActive }) => cx(
                                                            'relative flex items-center gap-2.5 h-8 px-2.5 rounded-sm text-sm',
                                                            'transition-colors duration-[120ms]',
                                                            rail && 'lg:justify-center lg:px-0',
                                                            isActive
                                                                ? 'bg-accent-soft text-accent font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-accent'
                                                                : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                                                        )}
                                                    >
                                                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                                                        <span className={cx('truncate', rail && 'lg:sr-only')}>{item.name}</span>
                                                        {count > 0 && (
                                                            <span className={cx(
                                                                'ml-auto font-mono tabular-nums text-2xs px-1.5 rounded-sm bg-surface-3 text-fg-muted',
                                                                rail && 'lg:absolute lg:top-0.5 lg:right-1 lg:ml-0 lg:px-1 lg:bg-accent lg:text-accent-fg'
                                                            )}>
                                                                {count > 99 ? '99+' : count}
                                                            </span>
                                                        )}
                                                    </NavLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="hidden lg:block border-t border-border p-2">
                    <button
                        type="button"
                        onClick={() => setCollapsed(c => !c)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-pressed={collapsed}
                        className={cx('w-full flex items-center gap-2.5 h-8 px-2.5 rounded-sm text-sm text-fg-muted hover:bg-surface-3 hover:text-fg', rail && 'justify-center px-0')}
                    >
                        {collapsed ? <FiChevronsRight aria-hidden="true" className="size-4" /> : <FiChevronsLeft aria-hidden="true" className="size-4" />}
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
