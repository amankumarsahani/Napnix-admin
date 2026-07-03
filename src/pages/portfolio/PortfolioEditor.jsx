import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { portfolioAPI } from '../../api';
import { FiArrowLeft, FiSave } from '../../components/icons/FeatherIcons';

const CATEGORIES = ['Web Platform', 'Mobile App', 'Dashboard', 'AI'];
const ACCENTS = ['amber', 'emerald', 'sky', 'violet', 'rose', 'orange', 'indigo', 'default'];
const SIZES = ['small', 'wide', 'large'];

const slugify = (str) =>
    String(str).toLowerCase().replace(/—/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(', ') : (arr || ''));
const fromCsv = (str) => String(str).split(',').map((s) => s.trim()).filter(Boolean);

export default function PortfolioEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);

    const [form, setForm] = useState({
        title: '',
        slug: '',
        category: 'Web Platform',
        description: '',
        tags: '',
        tech_stack: '',
        metric: 'Live',
        client: '',
        industry: '',
        image_url: '',
        accent: 'default',
        size: 'small',
        status: 'published',
        featured: false,
        sort_order: 0,
    });

    useEffect(() => {
        if (isEditMode) fetchProject();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProject = async () => {
        try {
            setFetching(true);
            const res = await portfolioAPI.getById(id);
            if (res.success && res.project) {
                const p = res.project;
                setForm({
                    title: p.title || '',
                    slug: p.slug || '',
                    category: p.category || 'Web Platform',
                    description: p.description || '',
                    tags: toCsv(p.tags),
                    tech_stack: toCsv(p.tech_stack),
                    metric: p.metric || '',
                    client: p.client || '',
                    industry: p.industry || '',
                    image_url: p.image_url || '',
                    accent: p.accent || 'default',
                    size: p.size || 'small',
                    status: p.status || 'published',
                    featured: !!p.featured,
                    sort_order: p.sort_order ?? 0,
                });
            } else {
                toast.error('Project not found');
                navigate('/portfolio');
            }
        } catch {
            toast.error('Failed to load project');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
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
            ...form,
            slug: form.slug || slugify(form.title),
            tags: fromCsv(form.tags),
            tech_stack: fromCsv(form.tech_stack),
            sort_order: parseInt(form.sort_order) || 0,
            client: form.client || null,
            industry: form.industry || null,
            image_url: form.image_url || null,
        };
        try {
            setLoading(true);
            if (isEditMode) {
                await portfolioAPI.update(id, payload);
                toast.success('Project updated');
            } else {
                await portfolioAPI.create(payload);
                toast.success('Project created');
            }
            navigate('/portfolio');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to save project');
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between gap-4">
                <button type="button" onClick={() => navigate('/portfolio')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600">
                    <FiArrowLeft />
                    <span>Back</span>
                </button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                    <FiSave />
                    <span>{loading ? 'Saving...' : 'Save Project'}</span>
                </button>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {isEditMode ? 'Edit Project' : 'Add Project'}
            </h1>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div>
                    <label className={labelCls}>Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} className={inputCls} placeholder="e.g. Taxiologists" />
                </div>

                <div>
                    <label className={labelCls}>Slug</label>
                    <input name="slug" value={form.slug} onChange={handleChange} className={`${inputCls} font-mono text-sm`} placeholder="auto-generated from title" />
                </div>

                <div>
                    <label className={labelCls}>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputCls} placeholder="What the product does and who it's for." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Metric / Badge</label>
                        <input name="metric" value={form.metric} onChange={handleChange} className={inputCls} placeholder="Live / +45% Sales / 50K Downloads" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Tags (comma separated)</label>
                        <input name="tags" value={form.tags} onChange={handleChange} className={inputCls} placeholder="Mobile App, Dashboard, Real-time" />
                    </div>
                    <div>
                        <label className={labelCls}>Tech Stack (comma separated)</label>
                        <input name="tech_stack" value={form.tech_stack} onChange={handleChange} className={inputCls} placeholder="React Native, Node.js, MySQL" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Client (optional)</label>
                        <input name="client" value={form.client} onChange={handleChange} className={inputCls} placeholder="Leave blank if confidential" />
                    </div>
                    <div>
                        <label className={labelCls}>Industry (optional)</label>
                        <input name="industry" value={form.industry} onChange={handleChange} className={inputCls} placeholder="Transport & Fleet" />
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Image URL (optional — leave blank for a gradient card)</label>
                    <input name="image_url" value={form.image_url} onChange={handleChange} className={inputCls} placeholder="https://..." />
                </div>
            </div>

            {/* Display settings */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelCls}>Accent (gradient)</label>
                        <select name="accent" value={form.accent} onChange={handleChange} className={inputCls}>
                            {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Card Size</label>
                        <select name="size" value={form.size} onChange={handleChange} className={inputCls}>
                            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Sort Order</label>
                        <input type="number" name="sort_order" value={form.sort_order} onChange={handleChange} className={inputCls} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <label className={labelCls}>Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-3 mt-6">
                        <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured project</span>
                    </label>
                </div>
            </div>
        </form>
    );
}
