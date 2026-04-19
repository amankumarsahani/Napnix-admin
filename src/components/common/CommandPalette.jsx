import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiBarChart2, FiUsers, FiSettings, FiBriefcase, FiZap, FiFileText,
    FiMail, FiMessageCircle, FiLayout, FiCreditCard, FiActivity,
    FiServer, FiHardDrive, FiLayers
} from '../icons/FeatherIcons';

const routeSections = [
    {
        title: 'Main Menu',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: <FiBarChart2 size={18} /> },
            { name: 'Tenants', path: '/tenants', icon: <FiLayers size={18} /> },
            { name: 'Clients', path: '/clients', icon: <FiUsers size={18} /> },
            { name: 'Projects', path: '/projects', icon: <FiBriefcase size={18} /> },
            { name: 'Leads', path: '/leads', icon: <FiZap size={18} /> },
        ]
    },
    {
        title: 'Communication',
        items: [
            { name: 'Inquiries', path: '/inquiries', icon: <FiMail size={18} /> },
            { name: 'Campaigns', path: '/campaigns', icon: <FiMessageCircle size={18} /> },
            { name: 'Workflows', path: '/workflows', icon: <FiActivity size={18} /> },
            { name: 'Blogs', path: '/blogs', icon: <FiFileText size={18} /> },
        ]
    },
    {
        title: 'Infrastructure',
        items: [
            { name: 'Servers', path: '/infrastructure/servers', icon: <FiServer size={18} /> },
            { name: 'Backups', path: '/infrastructure/backups', icon: <FiHardDrive size={18} /> },
        ]
    },
    {
        title: 'System',
        items: [
            { name: 'Documents', path: '/documents', icon: <FiFileText size={18} /> },
            { name: 'Templates', path: '/templates', icon: <FiLayout size={18} /> },
            { name: 'Transactions', path: '/transactions', icon: <FiCreditCard size={18} /> },
            { name: 'Settings', path: '/settings', icon: <FiSettings size={18} /> },
            { name: 'Team', path: '/team', icon: <FiUsers size={18} /> },
        ]
    }
];

export default function CommandPalette({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const getFilteredSections = useCallback(() => {
        if (!query.trim()) return routeSections;
        const q = query.toLowerCase();
        return routeSections
            .map(section => ({
                ...section,
                items: section.items.filter(item =>
                    item.name.toLowerCase().includes(q) ||
                    item.path.toLowerCase().includes(q)
                )
            }))
            .filter(section => section.items.length > 0);
    }, [query]);

    const filteredSections = getFilteredSections();
    const flatResults = filteredSections.flatMap(section =>
        section.items.map(item => ({ ...item, section: section.title }))
    );

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!listRef.current) return;
        const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(flatResults.length, 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(flatResults.length, 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (flatResults[selectedIndex]) {
                    navigate(flatResults[selectedIndex].path);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!isOpen) return null;

    let itemCounter = 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search pages..."
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls="command-palette-list"
                        aria-activedescendant={flatResults.length > 0 ? `cp-item-${selectedIndex}` : undefined}
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-y-auto py-2 scroll-smooth" role="listbox" id="command-palette-list">
                    {flatResults.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">No results found for "{query}"</p>
                        </div>
                    ) : (
                        filteredSections.map((section) => (
                            <div key={section.title} role="group" aria-label={section.title}>
                                <div className="px-5 pt-3 pb-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {section.title}
                                    </span>
                                </div>
                                {section.items.map((item) => {
                                    const currentIndex = itemCounter++;
                                    const isSelected = currentIndex === selectedIndex;
                                    return (
                                        <button
                                            key={item.path}
                                            data-index={currentIndex}
                                            id={`cp-item-${currentIndex}`}
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                navigate(item.path);
                                                onClose();
                                            }}
                                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100 ${
                                                isSelected
                                                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <span className={`shrink-0 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {item.icon}
                                            </span>
                                            <span className="text-sm font-medium flex-1">{item.name}</span>
                                            <span className={`text-[11px] ${isSelected ? 'text-brand-500/70 dark:text-brand-400/60' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {item.path}
                                            </span>
                                            {isSelected && (
                                                <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 rounded">
                                                    ↵
                                                </kbd>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-medium">↑↓</kbd>
                        Navigate
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-medium">↵</kbd>
                        Open
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-medium">esc</kbd>
                        Close
                    </span>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.15s ease-out;
                }
                .animate-scale-in {
                    animation: scale-in 0.15s ease-out;
                }
            `}</style>
        </div>
    );
}
