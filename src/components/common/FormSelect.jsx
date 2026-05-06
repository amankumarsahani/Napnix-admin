export default function FormSelect({ label, error, required, options, children, className, ...selectProps }) {
    return (
        <div>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {label}{required && ' *'}
                </label>
            )}
            <select
                {...selectProps}
                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all ${error ? 'border-rose-500 ring-2 ring-rose-500/20' : ''} ${className || ''}`}
            >
                {options
                    ? options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))
                    : children}
            </select>
            {error && (
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{error}</p>
            )}
        </div>
    );
}
