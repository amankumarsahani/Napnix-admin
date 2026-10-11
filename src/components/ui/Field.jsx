import { createContext, forwardRef, useContext, useId } from 'react';
import { cx } from './cx';

// Field wires label/hint/error to its control: the control picks up id, aria-describedby
// and aria-invalid from context, so pages never hand-write htmlFor/ids again.
const FieldContext = createContext(null);

export function Field({ label, hint, error, required, className, children }) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    return (
        <FieldContext.Provider value={{ id, describedBy: [errorId, hintId].filter(Boolean).join(' ') || undefined, invalid: !!error, required }}>
            <div className={cx('space-y-1.5', className)}>
                {label && (
                    <label htmlFor={id} className="block text-sm font-medium text-fg">
                        {label}
                        {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
                    </label>
                )}
                {children}
                {error ? (
                    <p id={errorId} className="text-xs text-danger">{error}</p>
                ) : hint ? (
                    <p id={hintId} className="text-xs text-fg-subtle">{hint}</p>
                ) : null}
            </div>
        </FieldContext.Provider>
    );
}

function useFieldProps(props) {
    const field = useContext(FieldContext);
    if (!field) return props;
    return {
        id: props.id ?? field.id,
        'aria-describedby': props['aria-describedby'] ?? field.describedBy,
        'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
        required: props.required ?? field.required,
        ...props,
    };
}

const CONTROL = cx(
    'w-full rounded-sm border bg-surface text-fg text-base placeholder:text-fg-subtle',
    'transition-colors duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed',
    'focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-0'
);
const borderFor = invalid => (invalid ? 'border-danger' : 'border-border-strong');

export const Input = forwardRef(function Input({ className, ...props }, ref) {
    const p = useFieldProps(props);
    return <input ref={ref} className={cx(CONTROL, 'h-9 px-3', borderFor(p['aria-invalid']), className)} {...p} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
    const p = useFieldProps(props);
    return <textarea ref={ref} rows={rows} className={cx(CONTROL, 'px-3 py-2', borderFor(p['aria-invalid']), className)} {...p} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
    const p = useFieldProps(props);
    return (
        <select ref={ref} className={cx(CONTROL, 'h-9 pl-3 pr-8', borderFor(p['aria-invalid']), className)} {...p}>
            {children}
        </select>
    );
});

/** Checkbox with its own label (does not need a Field). */
export const Checkbox = forwardRef(function Checkbox({ label, className, ...props }, ref) {
    const id = useId();
    return (
        <label htmlFor={props.id ?? id} className={cx('inline-flex items-center gap-2 text-sm text-fg cursor-pointer', className)}>
            <input ref={ref} id={props.id ?? id} type="checkbox" className="size-4 rounded-[4px] accent-[var(--accent)]" {...props} />
            {label}
        </label>
    );
});

/** On/off switch. `checked` + `onChange(nextBoolean)`. */
export function Switch({ checked, onChange, label, disabled, className }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-label={typeof label === 'string' ? label : undefined}
            disabled={disabled}
            onClick={() => onChange?.(!checked)}
            className={cx('inline-flex items-center gap-2 text-sm text-fg disabled:opacity-50', className)}
        >
            <span className={cx(
                'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-[120ms]',
                checked ? 'bg-accent' : 'bg-border-strong'
            )}>
                <span className={cx(
                    'absolute top-0.5 size-4 rounded-full bg-surface shadow-sm transition-transform duration-[120ms]',
                    checked ? 'translate-x-4' : 'translate-x-0.5'
                )} />
            </span>
            {label && <span>{label}</span>}
        </button>
    );
}
