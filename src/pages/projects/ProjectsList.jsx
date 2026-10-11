import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { clientsAPI, projectsAPI } from '../../api';
import { getPriorityColor } from '../../utils/statusColors';
import Pagination from '../../components/common/Pagination';
import {
    Button, ConfirmDialog, DataTable, Dialog, EmptyState, Field, IconButton, Input, PageHeader, Panel,
    SearchInput, Select, StatusBadge, Textarea, cx,
} from '../../components/ui';

const PAGE_SIZE = 10;
const EMPTY = { name: '', description: '', clientId: '', status: 'planning', priority: 'medium', budget: '', startDate: '', endDate: '', progress: 0 };
const inr = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const day = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
const fromProject = p => ({
    name: p.name || '', description: p.description || '', clientId: p.clientId || '', status: p.status || 'planning',
    priority: p.priority || 'medium', budget: p.budget ?? '', startDate: p.startDate?.split('T')[0] || '',
    endDate: p.endDate?.split('T')[0] || '', progress: p.progress || 0,
});

function Progress({ value }) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${v}%` }} />
            </span>
            <span className="font-mono tabular-nums text-xs w-8">{v}%</span>
        </span>
    );
}

function ProjectForm({ project, clients, onSubmit }) {
    const [form, setForm] = useState(() => (project?.id ? fromProject(project) : EMPTY));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    return (
        <form id="project-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project name" required className="sm:col-span-2">
                <Input value={form.name} onChange={set('name')} data-autofocus />
            </Field>
            <Field label="Description" className="sm:col-span-2">
                <Textarea rows={3} value={form.description} onChange={set('description')} />
            </Field>
            {/* The API rejects a project without a client */}
            <Field label="Client" required hint={clients.length ? undefined : 'Add a client first.'}>
                <Select value={form.clientId} onChange={set('clientId')}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </Select>
            </Field>
            <Field label="Status">
                <Select value={form.status} onChange={set('status')}>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                </Select>
            </Field>
            <Field label="Priority">
                <Select value={form.priority} onChange={set('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </Select>
            </Field>
            <Field label="Budget (₹)">
                <Input type="number" min="0" value={form.budget} onChange={set('budget')} className="font-mono" />
            </Field>
            <Field label="Start date">
                <Input type="date" value={form.startDate} onChange={set('startDate')} />
            </Field>
            <Field label="End date" error={form.startDate && form.endDate && form.endDate < form.startDate ? 'Ends before it starts' : undefined}>
                <Input type="date" value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} />
            </Field>
            <Field label={`Progress: ${form.progress}%`} className="sm:col-span-2">
                <input type="range" min="0" max="100" value={form.progress}
                    onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value, 10) }))}
                    className="w-full accent-[var(--accent)]" />
            </Field>
        </form>
    );
}

export default function ProjectsList() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [formProject, setFormProject] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const params = { page, limit: PAGE_SIZE, ...(search && { search }) };
    const query = useQuery({
        queryKey: ['projects', params],
        queryFn: () => projectsAPI.getAll(params),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    // Client options for the form: fetched once, not on every page change
    const clientsQuery = useQuery({
        queryKey: ['clients', 'options'],
        queryFn: async () => { const d = await clientsAPI.getAll({ limit: 1000 }); return Array.isArray(d) ? d : d.clients || []; },
        staleTime: 5 * 60 * 1000,
        enabled: !!formProject,
    });
    const data = query.data;
    const projects = data ? (Array.isArray(data) ? data : data.projects || []) : [];
    const pagination = data?.pagination;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });
    const save = useMutation({
        mutationFn: ({ id, form }) => (id ? projectsAPI.update(id, form) : projectsAPI.create(form)),
        onSuccess: (_, { id }) => { toast.success(id ? 'Project updated' : 'Project created'); setFormProject(null); invalidate(); },
        onError: err => toast.error(err.response?.data?.message || err.response?.data?.error || 'Could not save the project'),
    });
    const remove = useMutation({
        mutationFn: id => projectsAPI.delete(id),
        onSuccess: () => { toast.success('Project deleted'); setDeleting(null); invalidate(); },
        onError: () => toast.error('Failed to delete project'),
    });

    return (
        <div className="space-y-4">
            <PageHeader
                title="Projects"
                description={pagination ? `${pagination.total} projects` : undefined}
                actions={<Button variant="primary" onClick={() => setFormProject({})}><FiPlus className="size-4" />Add Project</Button>}
            />
            <SearchInput value={search} onChange={t => { setSearch(t); setPage(1); }} placeholder="Search projects" label="Search projects" className="w-full sm:w-72" />

            <Panel flush>
                <DataTable
                    caption="Projects"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={projects}
                    onRowClick={p => setFormProject(p)}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search ? `No projects match “${search}”` : 'No projects yet'}
                        action={!search && <Button variant="primary" size="sm" onClick={() => setFormProject({})}><FiPlus className="size-4" />Add Project</Button>} />}
                    columns={[
                        {
                            key: 'name', header: 'Project',
                            render: p => (
                                <span className="block min-w-0 max-w-md">
                                    <span className="block font-medium truncate">{p.name}</span>
                                    <span className="block text-xs text-fg-subtle truncate">{p.clientName || 'No client'}{p.description ? ` · ${p.description}` : ''}</span>
                                </span>
                            ),
                        },
                        { key: 'status', header: 'Status', render: p => <StatusBadge entity="project" status={p.status} /> },
                        {
                            key: 'priority', header: 'Priority',
                            render: p => <span className={cx('inline-flex rounded-sm border px-1.5 py-0.5 text-2xs font-medium capitalize', getPriorityColor(p.priority))}>{p.priority}</span>,
                        },
                        { key: 'budget', header: 'Budget', align: 'right', mono: true, render: p => inr(p.budget) },
                        {
                            key: 'dates', header: 'Dates', className: 'whitespace-nowrap text-fg-muted text-xs',
                            render: p => (p.startDate || p.endDate ? `${day(p.startDate) || '—'} → ${day(p.endDate) || '—'}` : <span className="text-fg-subtle">Not set</span>),
                        },
                        { key: 'progress', header: 'Progress', render: p => <Progress value={p.progress} /> },
                    ]}
                    actions={p => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={`Edit ${p.name}`} onClick={() => setFormProject(p)}><FiEdit2 className="size-4" /></IconButton>
                            <IconButton size="sm" variant="danger" label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><FiTrash2 className="size-4" /></IconButton>
                        </span>
                    )}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <Dialog
                open={!!formProject}
                onClose={() => setFormProject(null)}
                title={formProject?.id ? 'Edit project' : 'Add new project'}
                size="lg"
                footer={
                    <>
                        <Button onClick={() => setFormProject(null)} disabled={save.isPending}>Cancel</Button>
                        <Button variant="primary" type="submit" form="project-form" loading={save.isPending}>{formProject?.id ? 'Update project' : 'Create project'}</Button>
                    </>
                }
            >
                {formProject && (
                    <ProjectForm
                        key={formProject.id ?? 'new'}
                        project={formProject}
                        clients={clientsQuery.data || []}
                        onSubmit={form => save.mutate({ id: formProject.id, form })}
                    />
                )}
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete project?"
                message={deleting && `This deletes ${deleting.name}. This can't be undone.`}
                confirmText="Delete project"
            />
        </div>
    );
}
