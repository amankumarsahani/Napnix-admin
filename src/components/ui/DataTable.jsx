import { cx } from './cx';
import { SkeletonRows, EmptyState, ErrorState } from './States';

/**
 * Plain data table (no sorting engine until a page needs one).
 * columns: [{ key, header, render?(row), align?: 'left'|'right', className?, mono? }]
 * Rows are clickable (and keyboard-activatable) when onRowClick is given; put row buttons in a
 * column whose cells stop propagation (see `actions`).
 */
export function DataTable({
    columns, rows = [], rowKey = r => r.id, onRowClick, loading, error, onRetry,
    empty, caption, actions, className,
}) {
    const cols = actions ? [...columns, { key: '__actions', header: <span className="sr-only">Actions</span>, align: 'right', render: actions, isActions: true }] : columns;

    let body;
    if (loading) body = <SkeletonRows rows={6} />;
    else if (error) body = <ErrorState error={error} onRetry={onRetry} />;
    else if (!rows.length) body = empty ?? <EmptyState title="No records" />;

    return (
        <div className={cx('overflow-x-auto', className)}>
            <table className="w-full text-sm">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead className="sticky top-0 z-[1] bg-surface-2">
                    <tr className="border-b border-border">
                        {cols.map(col => (
                            <th key={col.key} scope="col"
                                className={cx('h-9 px-4 text-xs font-medium text-fg-muted whitespace-nowrap',
                                    col.align === 'right' ? 'text-right' : 'text-left', col.headerClassName)}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                {!body && (
                    <tbody className="divide-y divide-border">
                        {rows.map(row => (
                            <tr
                                key={rowKey(row)}
                                tabIndex={onRowClick ? 0 : undefined}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                onKeyDown={onRowClick ? e => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row); } : undefined}
                                className={cx(onRowClick && 'cursor-pointer hover:bg-surface-2 focus-visible:bg-surface-2')}
                            >
                                {cols.map(col => (
                                    <td key={col.key}
                                        onClick={col.isActions ? e => e.stopPropagation() : undefined}
                                        className={cx('h-9 px-4 py-1.5 text-fg',
                                            col.align === 'right' && 'text-right',
                                            col.mono && 'font-mono tabular-nums',
                                            col.className)}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                )}
            </table>
            {body}
        </div>
    );
}
