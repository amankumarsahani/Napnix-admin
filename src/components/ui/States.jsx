import { FiAlertTriangle, FiInbox } from 'react-icons/fi';
import { Button } from './Button';
import { cx } from './cx';

/** Placeholder block while content loads. */
export function Skeleton({ className }) {
    return <span aria-hidden="true" className={cx('block rounded-sm bg-surface-3 animate-pulse', className)} />;
}

/** Stacked skeleton lines shaped like table rows. */
export function SkeletonRows({ rows = 5, className }) {
    return (
        <div role="status" aria-label="Loading" className={cx('divide-y divide-border', className)}>
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 h-9">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/6 ml-auto" />
                </div>
            ))}
        </div>
    );
}

/** Nothing-here message with one optional primary action. */
export function EmptyState({ icon, title, description, action, className }) {
    return (
        <div className={cx('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
            <span aria-hidden="true" className="mb-3 text-fg-subtle">{icon || <FiInbox className="size-6" />}</span>
            <p className="text-sm font-medium text-fg">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** Error message with a Retry button. */
export function ErrorState({ error, onRetry, className }) {
    const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Something went wrong.';
    return (
        <div role="alert" className={cx('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
            <FiAlertTriangle aria-hidden="true" className="mb-3 size-6 text-danger" />
            <p className="text-sm font-medium text-fg">Couldn't load this</p>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">{message}</p>
            {onRetry && <Button size="sm" className="mt-4" onClick={() => onRetry()}>Retry</Button>}
        </div>
    );
}

const defaultIsEmpty = data => data == null || (Array.isArray(data) && data.length === 0);

/**
 * Renders the right state for a React Query result: loading -> skeleton, error -> ErrorState
 * with Retry, empty -> `empty`, otherwise children(data). `select` picks the list out of the
 * response for the empty check and for children (default: data itself).
 */
export function QueryState({ query, skeleton, empty, select = d => d, isEmpty = defaultIsEmpty, children }) {
    if (query.isLoading || query.isPending) return skeleton ?? <SkeletonRows />;
    if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
    const data = select(query.data);
    if (isEmpty(data)) return empty ?? <EmptyState title="Nothing here yet" />;
    return typeof children === 'function' ? children(data) : children;
}
