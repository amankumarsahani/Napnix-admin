import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCopy, FiLayout, FiPlus, FiTrash2 } from 'react-icons/fi';
import { nmTemplatesAPI } from '../../api/nexmail';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, IconButton, PageHeader, Panel, SearchInput, Skeleton } from '../../components/ui';

const STATUS_TONE = { active: 'success', archived: 'warning' };

export default function Templates() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState(null);

    const query = useQuery({
        queryKey: ['nexmail-templates', { search }],
        queryFn: () => nmTemplatesAPI.getAll({ search: search || undefined }).then(r => r.data || []),
        staleTime: 60 * 1000,
    });
    const templates = query.data || [];
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['nexmail-templates'] });

    const remove = useMutation({
        mutationFn: id => nmTemplatesAPI.delete(id),
        onSuccess: () => { toast.success('Template deleted'); setDeleting(null); refresh(); },
        onError: () => toast.error('Failed to delete'),
    });
    const clone = useMutation({
        mutationFn: id => nmTemplatesAPI.clone(id),
        onSuccess: r => { toast.success('Template cloned'); refresh(); navigate(`/email-marketing/templates/${r.templateId}/edit`); },
        onError: () => toast.error('Failed to clone'),
    });

    const addButton = <Button variant="primary" onClick={() => navigate('/email-marketing/templates/new')}><FiPlus className="size-4" />New template</Button>;

    let body;
    if (query.isLoading) body = <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-md" />)}</div>;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!templates.length) body = <Panel><EmptyState title={search ? `No templates match “${search}”` : 'No templates yet'} action={!search && addButton} /></Panel>;
    else {
        body = (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map(t => (
                    <Panel key={t.id}>
                        <div className="flex items-start justify-between gap-2">
                            <button type="button" onClick={() => navigate(`/email-marketing/templates/${t.id}/edit`)} className="flex min-w-0 items-center gap-3 text-left">
                                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-3 text-fg-subtle"><FiLayout className="size-5" /></span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-fg hover:underline">{t.name}</span>
                                    <span className="block text-xs text-fg-subtle">{t.category} · v{t.version}{t.updated_at ? ` · ${new Date(t.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</span>
                                </span>
                            </button>
                            <Badge tone={STATUS_TONE[t.status] || 'neutral'} className="capitalize">{t.status}</Badge>
                        </div>
                        <div className="mt-4 flex justify-end gap-0.5">
                            <IconButton size="sm" label={`Clone ${t.name}`} onClick={() => clone.mutate(t.id)} disabled={clone.isPending}><FiCopy className="size-4" /></IconButton>
                            <IconButton size="sm" variant="danger" label={`Delete ${t.name}`} onClick={() => setDeleting(t)}><FiTrash2 className="size-4" /></IconButton>
                        </div>
                    </Panel>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Email templates" description={query.data ? `${templates.length} templates` : undefined} actions={addButton} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search templates" label="Search templates" className="w-full sm:w-72" />
            {body}
            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete template?"
                message={deleting && `This deletes “${deleting.name}”. This can’t be undone.`}
                confirmText="Delete template"
            />
        </div>
    );
}
