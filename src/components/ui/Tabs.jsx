import { useRef } from 'react';
import { cx } from './cx';

/**
 * Tab bar with roving tabindex (Left/Right/Home/End). The page renders the active panel itself.
 * tabs: [{ id, label, count? }]; value: active id; onChange(id).
 */
export function Tabs({ tabs, value, onChange, label = 'Sections', className }) {
    const refs = useRef({});
    const move = (index) => {
        const tab = tabs[(index + tabs.length) % tabs.length];
        onChange(tab.id);
        refs.current[tab.id]?.focus();
    };
    const onKeyDown = (e, i) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); move(i + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); move(i - 1); }
        else if (e.key === 'Home') { e.preventDefault(); move(0); }
        else if (e.key === 'End') { e.preventDefault(); move(tabs.length - 1); }
    };
    return (
        <div role="tablist" aria-label={label} className={cx('flex gap-1 border-b border-border overflow-x-auto overflow-y-hidden', className)}>
            {tabs.map((tab, i) => {
                const selected = tab.id === value;
                return (
                    <button
                        key={tab.id}
                        ref={el => { refs.current[tab.id] = el; }}
                        role="tab"
                        type="button"
                        id={`tab-${tab.id}`}
                        aria-selected={selected}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                        onKeyDown={e => onKeyDown(e, i)}
                        className={cx(
                            'relative -mb-px inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium whitespace-nowrap border-b-2',
                            'transition-colors duration-[120ms]',
                            selected ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                        )}
                    >
                        {tab.label}
                        {tab.count != null && <span className="font-mono tabular-nums text-2xs text-fg-subtle">{tab.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}
