import { forwardRef } from 'react';
import { cx } from './cx';

const VARIANTS = {
    primary: 'bg-accent text-accent-fg hover:bg-accent-hover border border-transparent',
    secondary: 'bg-surface text-fg border border-border-strong hover:bg-surface-2',
    ghost: 'bg-transparent text-fg-muted border border-transparent hover:bg-surface-2 hover:text-fg',
    danger: 'bg-surface text-danger border border-border-strong hover:bg-danger-soft',
};

const SIZES = {
    sm: 'h-8 px-2.5 text-sm gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
};

const Spinner = () => (
    <span aria-hidden="true" className="size-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
);

/**
 * Button. variant: primary | secondary | ghost | danger; size: sm | md.
 * `loading` disables it and shows a spinner while keeping the label for screen readers.
 */
export const Button = forwardRef(function Button(
    { variant = 'secondary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cx(
                'inline-flex items-center justify-center rounded-sm font-medium whitespace-nowrap',
                'transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed',
                VARIANTS[variant], SIZES[size], className
            )}
            {...rest}
        >
            {loading && <Spinner />}
            {children}
        </button>
    );
});

/** Icon-only button. `label` is required: it becomes the accessible name and tooltip. */
export const IconButton = forwardRef(function IconButton(
    { label, variant = 'ghost', size = 'md', className, children, type = 'button', ...rest },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            aria-label={label}
            title={label}
            className={cx(
                'inline-flex items-center justify-center rounded-sm transition-colors duration-[120ms]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                size === 'sm' ? 'size-8' : 'size-9',
                VARIANTS[variant], className
            )}
            {...rest}
        >
            {children}
        </button>
    );
});
