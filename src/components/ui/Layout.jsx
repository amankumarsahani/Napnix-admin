import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { cx } from './cx';

/** Page title block: the only h1 on a page. `back` = { to, label }. */
export function PageHeader({ title, description, actions, back, children, className }) {
    return (
        <header className={cx('mb-6', className)}>
            {back && (
                <Link to={back.to} className="inline-flex items-center gap-1 mb-2 text-sm text-fg-muted hover:text-fg">
                    <FiArrowLeft aria-hidden="true" className="size-3.5" />
                    {back.label || 'Back'}
                </Link>
            )}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold text-fg">{title}</h1>
                    {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
        </header>
    );
}

/** Bordered surface with an optional titled header and toolbar. `flush` removes body padding (tables). */
export function Panel({ title, description, actions, flush = false, className, bodyClassName, children }) {
    return (
        <section className={cx('rounded-md border border-border bg-surface', className)}>
            {(title || actions) && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
                    <div className="min-w-0">
                        {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
                        {description && <p className="text-xs text-fg-subtle">{description}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={cx(!flush && 'p-4', bodyClassName)}>{children}</div>
        </section>
    );
}

/**
 * Key figure. Only pass `delta` when there is a real comparison to show
 * ({ value: '+12%', direction: 'up' | 'down', label: 'vs last month' }).
 */
export function StatCard({ label, value, hint, delta, icon, className }) {
    return (
        <div className={cx('rounded-md border border-border bg-surface p-4', className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-fg-muted">{label}</p>
                {icon && <span aria-hidden="true" className="text-fg-subtle">{icon}</span>}
            </div>
            <p className="mt-1.5 text-xl font-semibold font-mono tabular-nums text-fg">{value}</p>
            {delta && (
                <p className={cx('mt-1 text-xs font-medium', delta.direction === 'down' ? 'text-danger' : 'text-success')}>
                    {delta.value}{delta.label && <span className="text-fg-subtle font-normal"> {delta.label}</span>}
                </p>
            )}
            {!delta && hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
        </div>
    );
}

/** Initials avatar on a neutral background. */
export function Avatar({ name = '', size = 'md', className }) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
    return (
        <span
            aria-hidden="true"
            className={cx(
                'inline-flex shrink-0 items-center justify-center rounded-full bg-surface-3 text-fg-muted font-medium',
                size === 'sm' ? 'size-6 text-2xs' : size === 'lg' ? 'size-10 text-sm' : 'size-8 text-xs',
                className
            )}
        >
            {initials}
        </span>
    );
}
