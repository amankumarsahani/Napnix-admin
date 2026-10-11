import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiSend } from 'react-icons/fi';
import { documentTemplatesAPI } from '../../api';
import {
    Badge, Button, DataTable, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel,
    SearchInput, SkeletonRows, cx,
} from '../../components/ui';
import TemplateFields, { DocumentPreview } from './TemplateFields';

const CATEGORY_TONE = { sales: 'info', legal: 'neutral', finance: 'success', operations: 'warning' };
const EMPTY = { name: '', description: '', category: 'sales', content: '' };
const slugify = s => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const parseVars = v => (typeof v === 'string' ? JSON.parse(v || '[]') : v || []);

/** Fill variables, see the rendered document (debounced server preview) and email it. */
function PreviewSend({ templateId }) {
    const templateQuery = useQuery({
        queryKey: ['document-templates', String(templateId)],
        queryFn: async () => (await documentTemplatesAPI.getById(templateId)).data,
    });
    const template = templateQuery.data;
    const [vars, setVars] = useState({});
    const [debounced, setDebounced] = useState({});
    const [send, setSend] = useState({ to: '', subject: '' });

    useEffect(() => {
        const t = setTimeout(() => setDebounced(vars), 300);
        return () => clearTimeout(t);
    }, [vars]);

    const filled = Object.values(debounced).some(Boolean);
    const previewQuery = useQuery({
        queryKey: ['document-preview', templateId, debounced],
        queryFn: async () => (await documentTemplatesAPI.preview(templateId, debounced)).data.renderedContent,
        enabled: !!template && filled,
        placeholderData: keepPreviousData, // keyed by values, so a slow reply can't overwrite a newer one
    });

    const sendMut = useMutation({
        mutationFn: () => documentTemplatesAPI.send(templateId, send.to, send.subject || `${template.name} from Napnix`, vars),
        onSuccess: () => toast.success('Document sent'),
        onError: () => toast.error('Failed to send document'),
    });

    if (templateQuery.isLoading) return <SkeletonRows rows={6} />;
    if (templateQuery.isError || !template) return <ErrorState error={templateQuery.error} onRetry={templateQuery.refetch} />;

    const names = parseVars(template.variables);
    const html = filled ? (previewQuery.data ?? template.content) : template.content;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
            <div className="space-y-4">
                {names.length > 0 && (
                    <fieldset className="space-y-3">
                        <legend className="mb-1 text-sm font-semibold text-fg">Variables</legend>
                        {names.map(key => (
                            <Field key={key} label={key.replace(/_/g, ' ')}>
                                <Input value={vars[key] || ''} onChange={e => setVars(v => ({ ...v, [key]: e.target.value }))} placeholder={`Enter ${key.replace(/_/g, ' ')}`} />
                            </Field>
                        ))}
                    </fieldset>
                )}
                <form className="space-y-3 pt-4 border-t border-border" onSubmit={e => { e.preventDefault(); if (send.to) sendMut.mutate(); }}>
                    <p className="text-sm font-semibold text-fg">Send by email</p>
                    <Field label="Recipient email" required>
                        <Input type="email" value={send.to} onChange={e => setSend(s => ({ ...s, to: e.target.value }))} placeholder="client@example.com" />
                    </Field>
                    <Field label="Subject">
                        <Input value={send.subject} onChange={e => setSend(s => ({ ...s, subject: e.target.value }))} placeholder={`${template.name} from Napnix`} />
                    </Field>
                    <Button type="submit" variant="primary" className="w-full" loading={sendMut.isPending} disabled={!send.to}>
                        {!sendMut.isPending && <FiSend className="size-4" />}Send
                    </Button>
                </form>
            </div>
            <DocumentPreview html={html} className={cx('h-[60dvh] min-h-96', previewQuery.isFetching && 'opacity-80')} />
        </div>
    );
}

export default function Documents() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [previewId, setPreviewId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY);

    const query = useQuery({
        queryKey: ['document-templates', 'list'],
        queryFn: async () => (await documentTemplatesAPI.getAll()).data || [],
        staleTime: 2 * 60 * 1000,
    });
    // The API has no search param and returns every template; filter here
    const term = search.trim().toLowerCase();
    const templates = (query.data || []).filter(t => !term || `${t.name} ${t.description || ''} ${t.category}`.toLowerCase().includes(term));

    const create = useMutation({
        mutationFn: () => documentTemplatesAPI.create({ ...createForm, slug: slugify(createForm.name) }),
        onSuccess: () => {
            toast.success('Template created');
            setCreating(false);
            setCreateForm(EMPTY);
            queryClient.invalidateQueries({ queryKey: ['document-templates'] });
        },
        onError: err => toast.error(err.response?.data?.error || 'Failed to create template'),
    });
    const submitCreate = () => {
        if (!createForm.name.trim() || !createForm.content.trim()) { toast.error('Name and content are required'); return; }
        create.mutate();
    };

    const previewing = (query.data || []).find(t => t.id === previewId);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Document Templates"
                description="Personalize and send professional documents to your clients."
                actions={<Button variant="primary" onClick={() => setCreating(true)}><FiPlus className="size-4" />Create Template</Button>}
            />
            <SearchInput value={search} onChange={setSearch} delay={0} placeholder="Search documents" label="Search documents" className="w-full sm:w-72" />

            <Panel flush>
                <DataTable
                    caption="Document templates"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={templates}
                    onRowClick={t => setPreviewId(t.id)}
                    empty={<EmptyState title={search ? `No templates match “${search}”` : 'No templates yet'} />}
                    columns={[
                        {
                            key: 'name', header: 'Template',
                            render: t => (
                                <span className="block max-w-xl">
                                    <span className="flex items-center gap-2 font-medium">{t.name}{(t.is_default ?? t.isDefault) ? <Badge tone="info">Default</Badge> : null}</span>
                                    {t.description && <span className="block text-xs text-fg-subtle truncate">{t.description}</span>}
                                </span>
                            ),
                        },
                        { key: 'category', header: 'Category', render: t => <Badge tone={CATEGORY_TONE[t.category] || 'neutral'}><span className="capitalize">{t.category}</span></Badge> },
                    ]}
                    actions={t => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={`Preview and send ${t.name}`} onClick={() => setPreviewId(t.id)}><FiSend className="size-4" /></IconButton>
                            <IconButton size="sm" label={`Edit ${t.name}`} onClick={() => navigate(`/documents/${t.id}/edit`)}><FiEdit2 className="size-4" /></IconButton>
                        </span>
                    )}
                />
            </Panel>

            <Dialog open={!!previewId} onClose={() => setPreviewId(null)} title={previewing?.name || 'Preview'} description="Fill in the variables, check the document, then send it." size="xl">
                {previewId && <PreviewSend key={previewId} templateId={previewId} />}
            </Dialog>

            <Dialog
                open={creating}
                onClose={() => setCreating(false)}
                title="Create new template"
                size="xl"
                footer={
                    <>
                        <Button onClick={() => setCreating(false)} disabled={create.isPending}>Cancel</Button>
                        <Button variant="primary" onClick={submitCreate} loading={create.isPending}>Create Template</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TemplateFields value={createForm} onChange={setCreateForm} contentRows={12} />
                    <DocumentPreview html={createForm.content} className="h-96 lg:h-full min-h-72" />
                </div>
            </Dialog>
        </div>
    );
}
