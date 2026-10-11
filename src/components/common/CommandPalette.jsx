import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCornerDownLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { navForRole } from '../layout/navConfig';
import { cx } from '../ui';

// Cmd/Ctrl+K page switcher. Lists exactly what the sidebar shows for this role.
export default function CommandPalette({ isOpen, onClose }) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const returnFocus = useRef(null);

    const q = query.trim().toLowerCase();
    const sections = navForRole(user?.role)
        .map(group => ({
            ...group,
            items: q
                ? group.items.filter(item => `${item.name} ${group.title} ${item.path} ${item.keywords || ''}`.toLowerCase().includes(q))
                : group.items,
        }))
        .filter(group => group.items.length > 0);
    const flat = sections.flatMap(group => group.items);

    useEffect(() => {
        if (isOpen) {
            returnFocus.current = document.activeElement;
            setQuery('');
            setSelectedIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        } else {
            returnFocus.current?.focus?.();
        }
    }, [isOpen]);

    useEffect(() => { setSelectedIndex(0); }, [query]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const go = (item) => { navigate(item.path); onClose(); };

    const handleKeyDown = (e) => {
        const n = Math.max(flat.length, 1);
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => (i + 1) % n); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => (i - 1 + n) % n); }
        else if (e.key === 'Enter') { e.preventDefault(); if (flat[selectedIndex]) go(flat[selectedIndex]); }
        else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        else if (e.key === 'Tab') { e.preventDefault(); } // single input; keep focus inside
    };

    if (!isOpen) return null;

    let index = 0;
    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Go to page"
                className="relative w-full max-w-lg rounded-md border border-border bg-surface shadow-modal overflow-hidden"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border">
                    <FiSearch aria-hidden="true" className="size-4 text-fg-subtle shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Go to page…"
                        className="flex-1 bg-transparent text-base text-fg placeholder:text-fg-subtle focus:outline-none"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls="command-palette-list"
                        aria-activedescendant={flat.length ? `cp-item-${selectedIndex}` : undefined}
                    />
                    <kbd className="hidden sm:inline font-mono text-2xs px-1.5 rounded-sm border border-border text-fg-subtle">esc</kbd>
                </div>

                <div ref={listRef} id="command-palette-list" role="listbox" className="max-h-80 overflow-y-auto py-1.5">
                    {flat.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-fg-muted">No page matches “{query}”.</p>
                    ) : sections.map(group => (
                        <div key={group.id} role="group" aria-label={group.title}>
                            <p className="px-4 pt-2.5 pb-1 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{group.title}</p>
                            {group.items.map(item => {
                                const i = index++;
                                const selected = i === selectedIndex;
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.path}
                                        id={`cp-item-${i}`}
                                        data-index={i}
                                        role="option"
                                        aria-selected={selected}
                                        onClick={() => go(item)}
                                        onMouseMove={() => selectedIndex !== i && setSelectedIndex(i)}
                                        className={cx(
                                            'flex items-center gap-3 mx-1.5 px-2.5 h-9 rounded-sm cursor-pointer text-sm',
                                            selected ? 'bg-accent-soft text-accent' : 'text-fg'
                                        )}
                                    >
                                        <Icon aria-hidden="true" className={cx('size-4 shrink-0', !selected && 'text-fg-subtle')} />
                                        <span className="flex-1 truncate">{item.name}</span>
                                        <span className="font-mono text-2xs text-fg-subtle truncate">{item.path}</span>
                                        {selected && <FiCornerDownLeft aria-hidden="true" className="size-3.5" />}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
