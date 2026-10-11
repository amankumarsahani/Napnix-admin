import { useEffect, useId, useRef, useState } from 'react';
import { cx } from './cx';

/**
 * Dropdown menu. `trigger` is rendered inside the toggle button; `items` are
 * { label, onSelect, icon?, danger?, checked?, separatorBefore? } or { header: node }.
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Esc closes and returns focus, Tab closes.
 */
export function Menu({ trigger, label, items, align = 'right', className, buttonClassName }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const itemRefs = useRef([]);
    const id = useId();
    const actionable = items.map((item, i) => (item.onSelect ? i : null)).filter(i => i !== null);

    const focusItem = (pos) => {
        const n = actionable.length;
        itemRefs.current[actionable[((pos % n) + n) % n]]?.focus();
    };

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDown);
        requestAnimationFrame(() => focusItem(0));
        return () => document.removeEventListener('mousedown', onDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const close = (refocus = true) => { setOpen(false); if (refocus) buttonRef.current?.focus(); };

    const onMenuKeyDown = (e) => {
        const current = actionable.indexOf(itemRefs.current.indexOf(document.activeElement));
        if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(current + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(current - 1); }
        else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
        else if (e.key === 'End') { e.preventDefault(); focusItem(actionable.length - 1); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Tab') { close(false); }
    };

    return (
        <div ref={rootRef} className={cx('relative', className)}>
            <button
                ref={buttonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? id : undefined}
                aria-label={label}
                onClick={() => setOpen(o => !o)}
                onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
                className={buttonClassName}
            >
                {trigger}
            </button>
            {open && (
                <div
                    id={id}
                    role="menu"
                    aria-label={label}
                    onKeyDown={onMenuKeyDown}
                    className={cx(
                        'absolute top-full mt-1.5 min-w-56 z-50 py-1 rounded-md border border-border bg-surface shadow-pop',
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                >
                    {items.map((item, i) => (
                        item.header ? (
                            <div key={i} className="px-3 py-2 border-b border-border mb-1">{item.header}</div>
                        ) : (
                            <div key={i}>
                                {item.separatorBefore && <div role="separator" className="my-1 border-t border-border" />}
                                <button
                                    ref={el => { itemRefs.current[i] = el; }}
                                    type="button"
                                    role={item.checked !== undefined ? 'menuitemradio' : 'menuitem'}
                                    aria-checked={item.checked}
                                    tabIndex={-1}
                                    onClick={() => { close(); item.onSelect(); }}
                                    className={cx(
                                        'w-full flex items-center gap-2.5 px-3 h-8 text-sm text-left focus:outline-none',
                                        'hover:bg-surface-2 focus:bg-surface-2',
                                        item.danger ? 'text-danger' : 'text-fg'
                                    )}
                                >
                                    {item.icon && <span aria-hidden="true" className="text-fg-subtle">{item.icon}</span>}
                                    <span className="flex-1">{item.label}</span>
                                    {item.checked && <span aria-hidden="true" className="text-accent">✓</span>}
                                </button>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
