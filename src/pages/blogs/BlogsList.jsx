import ContentList from '../../components/content/ContentList';
import { blogsAPI } from '../../api';

const date = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const CONFIG = {
    noun: 'blog', nouns: 'blogs', title: 'Blogs', description: 'Posts on the agency website',
    newPath: '/blogs/new', newLabel: 'New blog', editPath: b => `/blogs/${b.id}/edit`,
    api: blogsAPI, resultKey: 'blogs', paged: true,
    thumb: b => b.image, subtitle: b => `${b.author || 'Unknown author'} · /${b.slug}`, category: b => b.category,
    extra: { header: 'Created', render: b => date(b.created_at) },
};

export default function BlogsList() {
    return <ContentList config={CONFIG} />;
}
