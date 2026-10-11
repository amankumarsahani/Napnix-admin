import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { documentTemplatesAPI } from '../../api';
import { Button, ErrorState, PageHeader, Panel, Skeleton } from '../../components/ui';
import TemplateFields, { DocumentPreview } from './TemplateFields';

function Editor({ template, id }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: template.name || '', description: template.description || '',
        category: template.category || 'sales', content: template.content || '',
    });

    const save = useMutation({
        mutationFn: () => documentTemplatesAPI.update(id, form),
        onSuccess: () => {
            toast.success('Template updated');
            queryClient.invalidateQueries({ queryKey: ['document-templates'] });
            navigate('/documents');
        },
        onError: () => toast.error('Failed to update template'),
    });

    const submit = () => {
        if (!form.name.trim() || !form.content.trim()) { toast.error('Name and content are required'); return; }
        save.mutate();
    };

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                back={{ to: '/documents', label: 'Documents' }}
                title="Edit template"
                description={template.name}
                actions={
                    <>
                        <Button onClick={() => navigate('/documents')} disabled={save.isPending}>Cancel</Button>
                        <Button variant="primary" onClick={submit} loading={save.isPending}>Save Changes</Button>
                    </>
                }
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Template">
                    <TemplateFields value={form} onChange={setForm} contentRows={20} />
                </Panel>
                <Panel title="Live preview" className="lg:sticky lg:top-0 self-start">
                    <DocumentPreview html={form.content} className="h-[640px]" />
                </Panel>
            </div>
        </div>
    );
}

export default function DocumentEdit() {
    const { id } = useParams();
    const query = useQuery({
        queryKey: ['document-templates', id],
        queryFn: async () => (await documentTemplatesAPI.getById(id)).data,
    });

    if (query.isLoading) return <div className="max-w-7xl mx-auto space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 rounded-md" /></div>;
    if (query.isError || !query.data) return <ErrorState error={query.error || new Error('Template not found')} onRetry={query.refetch} />;
    // keyed so a refetch with a different template resets the form
    return <Editor key={query.data.id} template={query.data} id={id} />;
}
