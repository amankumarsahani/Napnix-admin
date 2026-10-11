import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiStar, FiTrash2 } from 'react-icons/fi';
import Pagination from '../common/Pagination';
import {
    Badge, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, SearchInput, Select, cx,
} from '../ui';

const PAGE_SIZE = 10;
const STATUSES = [['all', 'All statuses'], ['published', 'Published'], ['draft', 'Draft']];

/**
 * Admin list for a content type (blogs, portfolio, case studies): search, status filter, feature
 * toggle, edit, delete-with-confirm. `config` describes the type; every page is ~30 lines of config.
 *   config: { noun, nouns, title, description, newPath, newLabel, editPath(item), api, resultKey,
 *             paged?, thumb(item), subtitle(item), category(item), extra? { header, render } }
 */
export default function ContentList({ config }) {
    const { noun, title, description, newPath, newLabel, editPath, api, resultKey, paged, thumb, subtitle, category, extra } = config;
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [deleting, setDeleting] = useState(null);

    const params = { page, limit: PAGE_SIZE, status, ...(search && { search }) };
    const key = [`content-${noun}`, params];
    const query = useQuery({
        queryKey: key,
        queryFn: () => api.getAll(paged ? params : { status, ...(search && { search }) }),
        staleTime: 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const items = query.data?.[resultKey] || [];
    const pagination = paged ? query.data?.pagination : null;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: [`content-${noun}`] });
    const feature = useMutation({
        mutationFn: item => api.update(item.id, { featured: !item.featured }),
        onSuccess: (_, item) => { toast.success(item.featured ? 'Removed from featured' : 'Marked as featured'); invalidate(); },
        onError: () => toast.error(`Failed to update ${noun}`),
    });
    const remove = useMutation({
        mutationFn: id => api.delete(id),
        onSuccess: () => { toast.success(`${noun[0].toUpperCase()}${noun.slice(1)} deleted`); setDeleting(null); invalidate(); },
        onError: () => toast.error(`Failed to delete ${noun}`),
    });

    const addButton = <Link to={newPath} className="inline-flex h-9 items-center gap-2 rounded-sm bg-accent px-3.5 text-sm text-accent-fg hover:bg-accent-hover"><FiPlus className="size-4" />{newLabel}</Link>;

    return (
        <div className="space-y-4">
            <PageHeader title={title} description={description} actions={addButton} />

            <div className="flex flex-wrap gap-2">
                <SearchInput value={search} onChange={t => { setSearch(t); setPage(1); }} placeholder={`Search ${config.nouns}`} label={`Search ${config.nouns}`} className="w-full sm:w-72" />
                <div className="w-40">
                    <Select aria-label="Filter by status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                </div>
            </div>

            <Panel flush>
                <DataTable
                    caption={title}
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={items}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search || status !== 'all' ? `No ${config.nouns} match` : `No ${config.nouns} yet`} action={!search && status === 'all' && addButton} />}
                    columns={[
                        {
                            key: 'title', header: noun[0].toUpperCase() + noun.slice(1),
                            render: item => (
                                <span className="flex items-center gap-3 min-w-0">
                                    {thumb(item)
                                        ? <img src={thumb(item)} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
                                        : <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-3 text-sm font-medium text-fg-muted">{item.title?.charAt(0)}</span>}
                                    <span className="min-w-0">
                                        <Link to={editPath(item)} className="block max-w-sm truncate text-sm font-medium text-fg hover:underline">{item.title}</Link>
                                        <span className="block max-w-xs truncate text-xs text-fg-subtle">{subtitle(item)}</span>
                                    </span>
                                </span>
                            ),
                        },
                        { key: 'category', header: 'Category', render: item => (category(item) ? <Badge>{category(item)}</Badge> : <span className="text-fg-subtle">—</span>) },
                        ...(extra ? [{ key: 'extra', header: extra.header, className: 'text-fg-muted whitespace-nowrap', render: extra.render }] : []),
                        {
                            key: 'status', header: 'Status',
                            render: item => (
                                <span className="flex flex-wrap items-center gap-1">
                                    <Badge tone={item.status === 'published' ? 'success' : 'warning'} className="capitalize">{String(item.status || 'draft').replace(/_/g, ' ')}</Badge>
                                    {item.featured && <Badge tone="info">Featured</Badge>}
                                </span>
                            ),
                        },
                    ]}
                    actions={item => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={item.featured ? `Remove ${item.title} from featured` : `Feature ${item.title}`} onClick={() => feature.mutate(item)}>
                                <FiStar className={cx('size-4', item.featured && 'fill-current text-warning')} />
                            </IconButton>
                            <Link to={editPath(item)} aria-label={`Edit ${item.title}`} className="grid size-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"><FiEdit2 className="size-4" /></Link>
                            <IconButton size="sm" variant="danger" label={`Delete ${item.title}`} onClick={() => setDeleting(item)}><FiTrash2 className="size-4" /></IconButton>
                        </span>
                    )}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title={`Delete ${noun}?`}
                message={deleting && `This deletes “${deleting.title}”. This can’t be undone.`}
                confirmText={`Delete ${noun}`}
            />
        </div>
    );
}
