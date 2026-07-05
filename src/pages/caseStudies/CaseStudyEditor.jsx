import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { caseStudiesAPI } from '../../api';
import { FiArrowLeft, FiSave } from '../../components/icons/FeatherIcons';

const ACCENTS = ['amber', 'emerald', 'sky', 'violet', 'rose', 'orange', 'indigo'];

const slugify = (str) =>
    String(str).toLowerCase().replace(/—/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(', ') : (arr || ''));
const fromCsv = (str) => String(str).split(',').map((s) => s.trim()).filter(Boolean);
// One item per line for list fields (problem, solution, flow, impact).
const toLines = (arr) => (Array.isArray(arr) ? arr.join('\n') : (arr || ''));
const fromLines = (str) => String(str).split('\n').map((s) => s.trim()).filter(Boolean);

const EMPTY = {
    title: '', slug: '', category: '', accent: 'amber', summary: '',
    tech: '', problem: '', solution: '', systemFlow: '', impact: '',
    quoteText: '', quoteAuthor: '', quoteRole: '',
    status: 'published', sortOrder: 0,
};

export default function CaseStudyEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (isEditMode) fetchCaseStudy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCaseStudy = async () => {
        try {
            setFetching(true);
            const res = await caseStudiesAPI.getById(id);
            if (res.success && res.caseStudy) {
                const c = res.caseStudy;
                setForm({
                    title: c.title || '',
                    slug: c.slug || '',
                    category: c.category || '',
                    accent: c.accent || 'amber',
                    summary: c.summary || '',
                    tech: toCsv(c.tech),
                    problem: toLines(c.problem),
                    solution: toLines(c.solution),
                    systemFlow: toLines(c.systemFlow),
                    impact: toLines(c.impact),
                    quoteText: c.quote?.text || '',
                    quoteAuthor: c.quote?.author || '',
                    quoteRole: c.quote?.role || '',
                    status: c.status || 'published',
                    sortOrder: c.sortOrder ?? 0,
                });
            } else {
                toast.error('Case study not found');
                navigate('/case-studies');
            }
        } catch {
            toast.error('Failed to load case study');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'title' && !isEditMode) next.slug = slugify(value);
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('Title is required');
            return;
        }
        const payload = {
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
            sort_order: parseInt(form.sortOrder) || 0,
        };
        try {
            setLoading(true);
            if (isEditMode) {
                await caseStudiesAPI.update(id, payload);
                toast.success('Case study updated');
            } else {
                await caseStudiesAPI.create(payload);
                toast.success('Case study created');
            }
            navigate('/case-studies');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to save case study');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    const inputCls = 'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';
    const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';
    const hintCls = 'text-xs text-slate-400 mt-1';

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between gap-4">
                <button type="button" onClick={() => navigate('/case-studies')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600">
                    <FiArrowLeft />
                    <span>Back</span>
                </button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                    <FiSave />
                    <span>{loading ? 'Saving...' : 'Save Case Study'}</span>
                </button>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {isEditMode ? 'Edit Case Study' : 'Add Case Study'}
            </h1>

            {/* Basics */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div>
                    <label className={labelCls}>Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} className={inputCls} placeholder="e.g. Taxiologists" />
                </div>

                <div>
                    <label className={labelCls}>Slug</label>
                    <input name="slug" value={form.slug} onChange={handleChange} className={`${inputCls} font-mono text-sm`} placeholder="must match the portfolio project slug" />
                    <p className={hintCls}>Shown at /portfolio/&lt;slug&gt;. Match the matching portfolio project's slug.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Category</label>
                        <input name="category" value={form.category} onChange={handleChange} className={inputCls} placeholder="Mobile App + Dashboard" />
                    </div>
                    <div>
                        <label className={labelCls}>Accent (gradient)</label>
                        <select name="accent" value={form.accent} onChange={handleChange} className={inputCls}>
                            {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Summary</label>
                    <textarea name="summary" value={form.summary} onChange={handleChange} rows={3} className={inputCls} placeholder="One-paragraph overview of the problem and what was built." />
                </div>

                <div>
                    <label className={labelCls}>Tech Stack (comma separated)</label>
                    <input name="tech" value={form.tech} onChange={handleChange} className={inputCls} placeholder="React Native, Node.js, MySQL" />
                </div>
            </div>

            {/* Story */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div>
                    <label className={labelCls}>Problem</label>
                    <textarea name="problem" value={form.problem} onChange={handleChange} rows={4} className={inputCls} placeholder="One point per line" />
                    <p className={hintCls}>One point per line.</p>
                </div>
                <div>
                    <label className={labelCls}>Solution</label>
                    <textarea name="solution" value={form.solution} onChange={handleChange} rows={4} className={inputCls} placeholder="One point per line" />
                    <p className={hintCls}>One point per line.</p>
                </div>
                <div>
                    <label className={labelCls}>System Flow</label>
                    <textarea name="systemFlow" value={form.systemFlow} onChange={handleChange} rows={5} className={inputCls} placeholder="One step per line" />
                    <p className={hintCls}>One step per line — rendered as an ordered flow.</p>
                </div>
                <div>
                    <label className={labelCls}>Impact</label>
                    <textarea name="impact" value={form.impact} onChange={handleChange} rows={4} className={inputCls} placeholder="One outcome per line" />
                    <p className={hintCls}>One outcome per line. Keep qualitative and honest — no fabricated metrics.</p>
                </div>
            </div>

            {/* Quote */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div>
                    <label className={labelCls}>Quote</label>
                    <textarea name="quoteText" value={form.quoteText} onChange={handleChange} rows={3} className={inputCls} placeholder="Client quote (optional)" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Quote Author</label>
                        <input name="quoteAuthor" value={form.quoteAuthor} onChange={handleChange} className={inputCls} placeholder="Parminder Singh" />
                    </div>
                    <div>
                        <label className={labelCls}>Quote Role</label>
                        <input name="quoteRole" value={form.quoteRole} onChange={handleChange} className={inputCls} placeholder="Owner, Taxiologists" />
                    </div>
                </div>
            </div>

            {/* Display settings */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Sort Order</label>
                        <input type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange} className={inputCls} />
                    </div>
                </div>
            </div>
        </form>
    );
}
