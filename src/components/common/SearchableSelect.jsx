import { useState, useMemo, useEffect, useRef } from 'react';

// Searchable dropdown component — filters locally, no API calls on type
const SearchableSelect = ({ options, value, onChange, placeholder, emptyLabel, renderOption, getOptionLabel, getOptionValue, hint }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(o => getOptionValue(o) === value);

    const filtered = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(o => getOptionLabel(o).toLowerCase().includes(q));
    }, [options, search, getOptionLabel]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg cursor-pointer flex items-center justify-between min-h-[38px]"
            >
                <span className={selectedOption ? 'text-fg' : 'text-fg-subtle'}>
                    {selectedOption ? getOptionLabel(selectedOption) : (emptyLabel || placeholder || 'Select...')}
                </span>
                <svg className={`w-4 h-4 text-fg-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-border">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md bg-surface-2 text-fg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors ${!value ? 'bg-surface-2 font-medium' : 'text-fg-muted'}`}
                        >
                            {emptyLabel || 'None'}
                        </button>
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-sm text-fg-subtle text-center">No results found</div>
                        )}
                        {filtered.map((option) => {
                            const optValue = getOptionValue(option);
                            const isSelected = optValue === value;
                            return (
                                <button
                                    type="button"
                                    key={optValue}
                                    onClick={() => { onChange(optValue, option); setIsOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors flex items-center justify-between ${isSelected ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium' : 'text-fg'}`}
                                >
                                    <span>{renderOption ? renderOption(option) : getOptionLabel(option)}</span>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {hint && <p className="text-xs text-fg-subtle mt-1">{hint}</p>}
        </div>
    );
};

export default SearchableSelect;
