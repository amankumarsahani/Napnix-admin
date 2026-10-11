import ContentList from '../../components/content/ContentList';
import { portfolioAPI } from '../../api';

const CONFIG = {
    noun: 'project', nouns: 'projects', title: 'Portfolio', description: 'Projects shown on the agency website',
    newPath: '/portfolio/new', newLabel: 'Add project', editPath: p => `/portfolio/${p.id}/edit`,
    api: portfolioAPI, resultKey: 'projects',
    thumb: p => p.image_url, subtitle: p => `/${p.slug}`, category: p => p.category,
    extra: { header: 'Order', render: p => p.sort_order ?? '—' },
};

export default function PortfolioList() {
    return <ContentList config={CONFIG} />;
}
