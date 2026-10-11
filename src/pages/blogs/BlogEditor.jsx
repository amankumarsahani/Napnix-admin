import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { blogsAPI } from '../../api';
import { Button, Checkbox, ErrorState, Field, Input, PageHeader, Panel, Select, Skeleton, Textarea } from '../../components/ui';

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
const EMPTY = {
    title: '', slug: '', excerpt: '', content: '', category: '', author: 'Napnix Admin', image: '',
    featured: false, status: 'published', read_time: 5, keywords: [],
};

function BlogForm({ blog, isEdit, onSave, saving, onCancel }) {
    const [form, setForm] = useState(() => ({ ...EMPTY, ...blog }));
    // Slug follows the title until someone edits it by hand
    const [slugTouched, setSlugTouched] = useState(isEdit);
    // keywords are typed as one string and split on save (splitting per keystroke ate trailing commas/spaces)
    const [keywords, setKeywords] = useState(() => (Array.isArray(blog?.keywords) ? blog.keywords.join(', ') : ''));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const [imgBroken, setImgBroken] = useState(false);

    const submit = e => {
        e.preventDefault();
        onSave({ ...form, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean) });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <PageHeader
                back={{ to: '/blogs', label: 'Blogs' }}
                title={isEdit ? 'Edit blog' : 'New blog'}
                actions={
                    <>
                        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={saving}>{isEdit ? 'Save changes' : form.status === 'published' ? 'Publish' : 'Save'}</Button>
                    </>
                }
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Panel title="Content">
                        <div className="space-y-4">
                            <Field label="Title" required>
                                <Input required value={form.title} placeholder="An engaging title"
                                    onChange={e => { const title = e.target.value; setForm(f => ({ ...f, title, ...(slugTouched ? {} : { slug: slugify(title) }) })); }} />
                            </Field>
                            <Field label="Slug" required hint="The post URL: /blog/slug">
                                <Input required value={form.slug} className="font-mono text-sm" placeholder="my-blog-post"
                                    onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }} />
                            </Field>
                            <Field label="Excerpt" hint="Short summary for preview cards">
                                <Textarea rows={3} value={form.excerpt || ''} onChange={set('excerpt')} />
                            </Field>
                            <div>
                                <p className="mb-1.5 text-sm font-medium text-fg">Main content</p>
                                <div className="blog-editor prose max-w-none">
                                    <CKEditor
                                        editor={ClassicEditor}
                                        data={form.content || ''}
                                        onChange={(_, editor) => { const content = editor.getData(); setForm(f => ({ ...f, content })); }}
                                        config={{
                                            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'],
                                            placeholder: 'Start writing…',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>

                <div className="space-y-4">
                    <Panel title="Publishing">
                        <div className="space-y-4">
                            <Field label="Status">
                                <Select value={form.status} onChange={set('status')}>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </Select>
                            </Field>
                            <Checkbox label="Feature this post" checked={!!form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                        </div>
                    </Panel>

                    <Panel title="Details">
                        <div className="space-y-4">
                            <Field label="Category"><Input value={form.category || ''} onChange={set('category')} placeholder="Guide, Technology…" /></Field>
                            <Field label="Author"><Input value={form.author || ''} onChange={set('author')} /></Field>
                            <Field label="Read time (min)"><Input type="number" min="1" value={form.read_time ?? ''} onChange={set('read_time')} className="font-mono" /></Field>
                            <Field label="SEO keywords" hint="Comma separated"><Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="seo, crm, guide" /></Field>
                        </div>
                    </Panel>

                    <Panel title="Feature image">
                        <div className="space-y-3">
                            <Field label="Image URL">
                                <Input value={form.image || ''} onChange={e => { setImgBroken(false); setForm(f => ({ ...f, image: e.target.value })); }} placeholder="https://…" />
                            </Field>
                            {form.image && !imgBroken && (
                                <img src={form.image} alt="" onError={() => setImgBroken(true)} className="aspect-video w-full rounded-sm border border-border object-cover" />
                            )}
                            {form.image && imgBroken && <p className="text-xs text-danger">This image URL didn&apos;t load.</p>}
                        </div>
                    </Panel>
                </div>
            </div>
        </form>
    );
}

export default function BlogEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const query = useQuery({
        queryKey: ['blog', id],
        queryFn: async () => {
            const r = await blogsAPI.getById(id);
            if (!r.success || !r.blog) throw new Error('Blog not found');
            return r.blog;
        },
        enabled: isEdit,
        staleTime: 0,
    });

    const save = useMutation({
        mutationFn: data => (isEdit ? blogsAPI.update(id, data) : blogsAPI.create(data)),
        onSuccess: () => {
            toast.success(isEdit ? 'Blog updated' : 'Blog created');
            queryClient.invalidateQueries({ queryKey: ['content-blog'] });
            queryClient.invalidateQueries({ queryKey: ['blog', id] });
            navigate('/blogs');
        },
        onError: err => toast.error(err.response?.data?.error || 'Failed to save blog'),
    });

    if (isEdit && query.isLoading) return <div className="max-w-5xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-md" /></div>;
    if (isEdit && query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;

    return (
        <div className="max-w-6xl">
            <BlogForm key={id || 'new'} blog={query.data} isEdit={isEdit} onSave={save.mutate} saving={save.isPending} onCancel={() => navigate('/blogs')} />
        </div>
    );
}
