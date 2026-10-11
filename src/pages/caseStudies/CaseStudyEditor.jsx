import { useState } from 'react';
import EditorPage from '../../components/content/EditorPage';
import { caseStudiesAPI } from '../../api';
import { Field, Input, Panel, Select, Textarea } from '../../components/ui';

const ACCENTS = ['amber', 'emerald', 'sky', 'violet', 'rose', 'orange', 'indigo'];

const slugify = str => String(str).toLowerCase().replace(/—/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const toCsv = arr => (Array.isArray(arr) ? arr.join(', ') : (arr || ''));
const fromCsv = str => String(str).split(',').map(s => s.trim()).filter(Boolean);
// one item per line for the list fields (problem, solution, flow, impact)
const toLines = arr => (Array.isArray(arr) ? arr.join('\n') : (arr || ''));
const fromLines = str => String(str).split('\n').map(s => s.trim()).filter(Boolean);

const fromRecord = c => ({
    title: c?.title || '', slug: c?.slug || '', category: c?.category || '', accent: c?.accent || 'amber', summary: c?.summary || '',
    tech: toCsv(c?.tech), problem: toLines(c?.problem), solution: toLines(c?.solution), systemFlow: toLines(c?.systemFlow), impact: toLines(c?.impact),
    quoteText: c?.quote?.text || '', quoteAuthor: c?.quote?.author || '', quoteRole: c?.quote?.role || '',
    status: c?.status || 'published', sortOrder: c?.sortOrder ?? 0,
});

function CaseStudyForm({ record, isEdit, onSave }) {
    const [form, setForm] = useState(() => fromRecord(record));
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    const submit = e => {
        e.preventDefault();
        onSave({
            title: form.title,
            slug: form.slug || slugify(form.title),
            category: form.category || null,
            accent: form.accent,
            summary: form.summary,
            tech: fromCsv(form.tech),
            problem: fromLines(form.problem),
            solution: fromLines(form.solution),
            systemFlow: fromLines(form.systemFlow),
            impact: fromLines(form.impact),
            quote: { text: form.quoteText, author: form.quoteAuthor, role: form.quoteRole },
            status: form.status,
            sort_order: parseInt(form.sortOrder, 10) || 0,
        });
    };

    return (
        <form id="content-form" onSubmit={submit} className="space-y-4">
            <Panel title="Overview">
                <div className="space-y-4">
                    <Field label="Title" required>
                        <Input required value={form.title} placeholder="e.g. Taxiologists"
                            onChange={e => { const title = e.target.value; setForm(f => ({ ...f, title, ...(slugTouched ? {} : { slug: slugify(title) }) })); }} />
                    </Field>
                    <Field label="Slug" hint="Must match the portfolio project slug">
                        <Input value={form.slug} className="font-mono text-sm" onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }} />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Category"><Input value={form.category} onChange={set('category')} placeholder="Mobile App + Dashboard" /></Field>
                        <Field label="Accent gradient"><Select value={form.accent} onChange={set('accent')}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</Select></Field>
                    </div>
                    <Field label="Summary"><Textarea rows={3} value={form.summary} onChange={set('summary')} placeholder="One paragraph on the problem and what was built." /></Field>
                    <Field label="Tech stack" hint="Comma separated"><Input value={form.tech} onChange={set('tech')} placeholder="React Native, Node.js, MySQL" /></Field>
                </div>
            </Panel>

            <Panel title="The story" description="One point per line">
                <div className="space-y-4">
                    <Field label="Problem"><Textarea rows={4} value={form.problem} onChange={set('problem')} /></Field>
                    <Field label="Solution"><Textarea rows={4} value={form.solution} onChange={set('solution')} /></Field>
                    <Field label="System flow" hint="One step per line"><Textarea rows={5} value={form.systemFlow} onChange={set('systemFlow')} /></Field>
                    <Field label="Impact" hint="One outcome per line"><Textarea rows={4} value={form.impact} onChange={set('impact')} /></Field>
                </div>
            </Panel>

            <Panel title="Client quote" description="Optional">
                <div className="space-y-4">
                    <Field label="Quote"><Textarea rows={3} value={form.quoteText} onChange={set('quoteText')} /></Field>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Author"><Input value={form.quoteAuthor} onChange={set('quoteAuthor')} /></Field>
                        <Field label="Role"><Input value={form.quoteRole} onChange={set('quoteRole')} placeholder="Owner, Taxiologists" /></Field>
                    </div>
                </div>
            </Panel>

            <Panel title="Publishing">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Status">
                        <Select value={form.status} onChange={set('status')}>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </Select>
                    </Field>
                    <Field label="Sort order"><Input type="number" value={form.sortOrder} onChange={set('sortOrder')} className="font-mono" /></Field>
                </div>
            </Panel>
        </form>
    );
}

const CONFIG = { noun: 'case study', listPath: '/case-studies', listLabel: 'Case studies', api: caseStudiesAPI, resultKey: 'caseStudy', Form: CaseStudyForm };

export default function CaseStudyEditor() {
    return <EditorPage config={CONFIG} />;
}
