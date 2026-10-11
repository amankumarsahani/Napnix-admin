import { useState } from 'react';
import EditorPage from '../../components/content/EditorPage';
import { portfolioAPI } from '../../api';
import { Checkbox, Field, Input, Panel, Select, Textarea } from '../../components/ui';

const CATEGORIES = ['Web Platform', 'Mobile App', 'Dashboard', 'AI'];
const ACCENTS = ['amber', 'emerald', 'sky', 'violet', 'rose', 'orange', 'indigo', 'default'];
const SIZES = ['small', 'wide', 'large'];

const slugify = str => String(str).toLowerCase().replace(/—/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const toCsv = arr => (Array.isArray(arr) ? arr.join(', ') : (arr || ''));
const fromCsv = str => String(str).split(',').map(s => s.trim()).filter(Boolean);

const fromRecord = p => ({
    title: p?.title || '', slug: p?.slug || '', category: p?.category || 'Web Platform', description: p?.description || '',
    tags: toCsv(p?.tags), tech_stack: toCsv(p?.tech_stack), metric: p ? (p.metric || '') : 'Live',
    client: p?.client || '', industry: p?.industry || '', image_url: p?.image_url || '',
    accent: p?.accent || 'default', size: p?.size || 'small', status: p?.status || 'published',
    featured: !!p?.featured, sort_order: p?.sort_order ?? 0,
});

function PortfolioForm({ record, isEdit, onSave }) {
    const [form, setForm] = useState(() => fromRecord(record));
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    const submit = e => {
        e.preventDefault();
        onSave({
            ...form,
            slug: form.slug || slugify(form.title),
            tags: fromCsv(form.tags),
            tech_stack: fromCsv(form.tech_stack),
            sort_order: parseInt(form.sort_order, 10) || 0,
            client: form.client || null,
            industry: form.industry || null,
            image_url: form.image_url || null,
        });
    };

    return (
        <form id="content-form" onSubmit={submit} className="space-y-4">
            <Panel title="Project">
                <div className="space-y-4">
                    <Field label="Title" required>
                        <Input required value={form.title} placeholder="e.g. Taxiologists"
                            onChange={e => { const title = e.target.value; setForm(f => ({ ...f, title, ...(slugTouched ? {} : { slug: slugify(title) }) })); }} />
                    </Field>
                    <Field label="Slug" hint="Auto-filled from the title until you edit it">
                        <Input value={form.slug} className="font-mono text-sm" onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }} />
                    </Field>
                    <Field label="Description"><Textarea rows={3} value={form.description} onChange={set('description')} placeholder="What the product does and who it's for." /></Field>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Category">
                            <Select value={form.category} onChange={set('category')}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</Select>
                        </Field>
                        <Field label="Metric or badge"><Input value={form.metric} onChange={set('metric')} placeholder="Live / +45% Sales / 50K Downloads" /></Field>
                        <Field label="Tags" hint="Comma separated"><Input value={form.tags} onChange={set('tags')} placeholder="Mobile App, Dashboard, Real-time" /></Field>
                        <Field label="Tech stack" hint="Comma separated"><Input value={form.tech_stack} onChange={set('tech_stack')} placeholder="React Native, Node.js, MySQL" /></Field>
                        <Field label="Client" hint="Optional. Leave blank if confidential"><Input value={form.client} onChange={set('client')} /></Field>
                        <Field label="Industry" hint="Optional"><Input value={form.industry} onChange={set('industry')} placeholder="Transport & Fleet" /></Field>
                    </div>
                    <Field label="Image URL" hint="Optional. Blank shows a gradient card"><Input value={form.image_url} onChange={set('image_url')} placeholder="https://…" /></Field>
                </div>
            </Panel>

            <Panel title="Display">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Accent gradient"><Select value={form.accent} onChange={set('accent')}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</Select></Field>
                    <Field label="Card size"><Select value={form.size} onChange={set('size')}>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</Select></Field>
                    <Field label="Sort order"><Input type="number" value={form.sort_order} onChange={set('sort_order')} className="font-mono" /></Field>
                    <Field label="Status">
                        <Select value={form.status} onChange={set('status')}>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </Select>
                    </Field>
                    <div className="self-end pb-2">
                        <Checkbox label="Featured project" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                    </div>
                </div>
            </Panel>
        </form>
    );
}

const CONFIG = { noun: 'project', listPath: '/portfolio', listLabel: 'Portfolio', api: portfolioAPI, resultKey: 'project', Form: PortfolioForm };

export default function PortfolioEditor() {
    return <EditorPage config={CONFIG} />;
}
