import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import { documentTemplatesAPI, templatesAPI } from '../../api';
import Pagination from '../../components/common/Pagination';
import { DocumentPreview } from './TemplateFields';
import {
    Badge, Button, Checkbox, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel,
    SearchInput, Select, Skeleton, Switch, Tabs, Textarea, cx,
} from '../../components/ui';

const PAGE_SIZE = 9;
const TYPES = [['email', 'Email'], ['sms', 'SMS'], ['whatsapp', 'WhatsApp'], ['push', 'Push'], ['other', 'Other']];
const CATEGORIES = [['notification', 'Notification'], ['marketing', 'Marketing'], ['transactional', 'Transactional'], ['system', 'System']];
const typeLabel = t => TYPES.find(([v]) => v === t)?.[1] || 'Other';
const EMPTY = { name: '', type: 'email', subject: '', html_content: '', description: '', variables: '', attachment_document_ids: '', category: 'notification', is_active: true };
const fromTemplate = t => ({
    name: t.name || '', type: t.type || 'email', subject: t.subject || '', html_content: t.html_content || '',
    description: t.description || '', variables: Array.isArray(t.variables) ? t.variables.join(', ') : '',
    attachment_document_ids: t.attachment_document_ids || '', category: t.category || 'notification', is_active: t.is_active !== false && t.is_active !== 0,
});
const idList = s => String(s || '').split(',').filter(Boolean);

function TemplateForm({ template, documents, onSubmit }) {
    const [form, setForm] = useState(() => (template?.id ? fromTemplate(template) : EMPTY));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const attached = idList(form.attachment_document_ids);
    const toggleDoc = id => setForm(f => {
        const ids = idList(f.attachment_document_ids);
        return { ...f, attachment_document_ids: (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]).join(',') };
    });
    const submit = e => {
        e.preventDefault();
        onSubmit({ ...form, variables: form.variables.split(',').map(v => v.trim()).filter(Boolean) });
    };
    const isText = form.type !== 'email';

    return (
        <form id="template-form" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Template name" required hint="Unique; the email service looks templates up by name">
                <Input required value={form.name} onChange={set('name')} placeholder="e.g. welcome-email" className="font-mono" data-autofocus />
            </Field>
            <Field label="Type" required>
                <Select value={form.type} onChange={set('type')}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
            </Field>
            <Field label="Category">
                <Select value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
            </Field>
            <Field label="Subject line">
                <Input value={form.subject} onChange={set('subject')} placeholder="e.g. Welcome to {{company}}!" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
                <Input value={form.description} onChange={set('description')} placeholder="What is this template used for?" />
            </Field>
            <Field label="Variables" hint="Comma-separated. Use them in the content as {{name}}" className="sm:col-span-2">
                <Input value={form.variables} onChange={set('variables')} placeholder="name, email, company" className="font-mono" />
            </Field>
            <Field label={isText ? 'Message' : 'HTML content'} required className="sm:col-span-2">
                <Textarea required rows={10} value={form.html_content} onChange={set('html_content')} className="font-mono text-xs"
                    placeholder={isText ? 'Hi {{name}}, your order #{{orderId}} is confirmed.' : '<h1>Hello {{name}}!</h1>\n<p>Welcome aboard.</p>'} />
            </Field>
            {form.type === 'email' && (
                <Field label="Default attachments" hint="Pre-selected whenever this email template is used" className="sm:col-span-2">
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-sm border border-border bg-surface-2 p-3">
                        {documents.length
                            ? documents.map(doc => (
                                <Checkbox key={doc.id} label={doc.name} checked={attached.includes(String(doc.id))} onChange={() => toggleDoc(String(doc.id))} />
                            ))
                            : <p className="text-xs text-fg-subtle">No document templates to attach.</p>}
                    </div>
                </Field>
            )}
            <Switch className="sm:col-span-2" checked={form.is_active} onChange={v => setForm(f => ({ ...f, is_active: v }))} label="Active (inactive templates are skipped when sending by name)" />
        </form>
    );
}

function TemplateCard({ t, onPreview, onEdit, onDelete }) {
    const vars = Array.isArray(t.variables) ? t.variables : [];
    const active = t.is_active !== false && t.is_active !== 0;
    return (
        <Panel className="flex flex-col" bodyClassName="flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-fg truncate font-mono text-sm" title={t.name}>{t.name}</h2>
                {!active && <Badge>Inactive</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge tone="info">{typeLabel(t.type)}</Badge>
                <Badge>{t.category}</Badge>
            </div>
            {t.subject && <p className="mt-3 text-sm text-fg truncate" title={t.subject}><span className="text-fg-subtle">Subject:</span> {t.subject}</p>}
            <p className="mt-1 text-sm text-fg-muted line-clamp-2">{t.description || 'No description'}</p>
            {vars.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1">
                    {vars.slice(0, 4).map(v => <code key={v} className="rounded-sm bg-surface-3 px-1.5 py-0.5 text-2xs text-fg-muted">{`{{${v}}}`}</code>)}
                    {vars.length > 4 && <span className="text-2xs text-fg-subtle">+{vars.length - 4} more</span>}
                </p>
            )}
            <div className="mt-auto pt-4 flex items-center justify-between">
                <Button size="sm" variant="ghost" onClick={() => onPreview(t)}><FiEye className="size-4" />Preview</Button>
                <span className="inline-flex gap-0.5">
                    <IconButton size="sm" label={`Edit ${t.name}`} onClick={() => onEdit(t)}><FiEdit2 className="size-4" /></IconButton>
                    <IconButton size="sm" variant="danger" label={`Delete ${t.name}`} onClick={() => onDelete(t)}><FiTrash2 className="size-4" /></IconButton>
                </span>
            </div>
        </Panel>
    );
}

export default function Templates() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const [formTemplate, setFormTemplate] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [preview, setPreview] = useState(null); // { name, html }

    const params = { page, limit: PAGE_SIZE, ...(type !== 'all' && { type }), ...(search && { search }) };
    const query = useQuery({
        queryKey: ['email-templates', params],
        queryFn: () => templatesAPI.getAll(params),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const statsQuery = useQuery({ queryKey: ['email-templates', 'stats'], queryFn: templatesAPI.getStats, staleTime: 2 * 60 * 1000 });
    const docsQuery = useQuery({
        queryKey: ['document-templates', 'options'],
        queryFn: () => documentTemplatesAPI.getAll().then(r => r.data || []),
        staleTime: 5 * 60 * 1000,
        enabled: !!formTemplate,
    });

    const templates = Array.isArray(query.data?.data) ? query.data.data : [];
    const pagination = query.data?.pagination;
    const stats = statsQuery.data?.data;
    const known = stats ? TYPES.slice(0, 4).reduce((s, [v]) => s + Number(stats[v] || 0), 0) : 0;
    const countFor = v => (!stats ? undefined : v === 'all' ? Number(stats.total || 0) : v === 'other' ? Math.max(0, Number(stats.total || 0) - known) : Number(stats[v] || 0));

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    const save = useMutation({
        mutationFn: ({ id, form }) => (id ? templatesAPI.update(id, form) : templatesAPI.create(form)),
        onSuccess: (_, { id }) => { toast.success(id ? 'Template updated' : 'Template created'); setFormTemplate(null); invalidate(); },
        onError: err => toast.error(err.response?.data?.error || err.response?.data?.message || 'Could not save the template'),
    });
    const remove = useMutation({
        mutationFn: id => templatesAPI.delete(id),
        onSuccess: () => { toast.success('Template deleted'); setDeleting(null); invalidate(); },
        onError: () => toast.error('Failed to delete template'),
    });
    const showPreview = useMutation({
        mutationFn: t => templatesAPI.preview(t.id, Object.fromEntries((Array.isArray(t.variables) ? t.variables : []).map(v => [v, `[${v}]`]))),
        onSuccess: (res, t) => setPreview({ name: t.name, html: res.html }),
        onError: () => toast.error('Failed to preview template'),
    });

    const addButton = <Button variant="primary" onClick={() => setFormTemplate({})}><FiPlus className="size-4" />New template</Button>;
    const filtered = search || type !== 'all';

    let body;
    if (query.isLoading) body = <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-md" />)}</div>;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!templates.length) {
        body = <Panel><EmptyState title={filtered ? 'No templates match these filters' : 'No templates yet'} action={!filtered && addButton} /></Panel>;
    } else {
        body = (
            <div className={cx('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4', query.isPlaceholderData && 'opacity-60')}>
                {templates.map(t => (
                    <TemplateCard key={t.id} t={t} onPreview={showPreview.mutate} onEdit={setFormTemplate} onDelete={setDeleting} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Templates" description="Email, SMS, WhatsApp and push message templates" actions={addButton} />
            <Tabs
                label="Template type"
                value={type}
                onChange={v => { setType(v); setPage(1); }}
                tabs={[['all', 'All'], ...TYPES].map(([id, label]) => ({ id, label, count: countFor(id) }))}
            />
            <SearchInput value={search} onChange={t => { setSearch(t); setPage(1); }} placeholder="Search name, subject" label="Search templates" className="w-full sm:w-72" />
            {body}
            {pagination && pagination.pages > 1 && (
                <Panel flush>
                    <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </Panel>
            )}

            <Dialog
                open={!!formTemplate}
                onClose={() => setFormTemplate(null)}
                title={formTemplate?.id ? 'Edit template' : 'New template'}
                size="xl"
                footer={
                    <>
                        <Button onClick={() => setFormTemplate(null)} disabled={save.isPending}>Cancel</Button>
                        <Button variant="primary" type="submit" form="template-form" loading={save.isPending}>{formTemplate?.id ? 'Save changes' : 'Create template'}</Button>
                    </>
                }
            >
                {formTemplate && (
                    <TemplateForm key={formTemplate.id ?? 'new'} template={formTemplate} documents={docsQuery.data || []}
                        onSubmit={form => save.mutate({ id: formTemplate.id, form })} />
                )}
            </Dialog>

            {/* Sandboxed: template HTML never runs in the admin origin */}
            <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview ? `Preview: ${preview.name}` : ''} description="Variables are filled with [placeholders]" size="xl">
                {preview && <DocumentPreview html={preview.html} title={`${preview.name} preview`} className="h-[60dvh]" />}
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete template?"
                message={deleting && `This deletes ${deleting.name}. This can't be undone.`}
                confirmText="Delete template"
            />
        </div>
    );
}
