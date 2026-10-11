import { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { cx } from './cx';

/**
 * Search box that reports changes after the user pauses typing (default 250ms).
 * `value` seeds/resets it; `onChange(term)` fires debounced; Esc clears.
 */
export function SearchInput({ value = '', onChange, delay = 250, placeholder = 'Search', label = 'Search', className }) {
    const [term, setTerm] = useState(value);
    const timer = useRef();
    const first = useRef(true);

    useEffect(() => { setTerm(value); }, [value]);

    useEffect(() => {
        if (first.current) { first.current = false; return undefined; }
        clearTimeout(timer.current);
        timer.current = setTimeout(() => onChange?.(term), delay);
        return () => clearTimeout(timer.current);
        // onChange intentionally omitted: callers often pass inline functions
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term, delay]);

    return (
        <div className={cx('relative', className)}>
            <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-subtle" />
            <input
                type="search"
                aria-label={label}
                value={term}
                placeholder={placeholder}
                onChange={e => setTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape' && term) { e.stopPropagation(); setTerm(''); } }}
                className={cx(
                    'w-full h-9 pl-9 pr-8 rounded-sm border border-border-strong bg-surface text-fg text-base',
                    'placeholder:text-fg-subtle focus:outline-none focus-visible:outline-2 focus-visible:outline-accent',
                    '[&::-webkit-search-cancel-button]:hidden'
                )}
            />
            {term && (
                <button type="button" aria-label="Clear search" onClick={() => setTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm text-fg-subtle hover:text-fg">
                    <FiX className="size-3.5" />
                </button>
            )}
        </div>
    );
}
