import ContentList from '../../components/content/ContentList';
import { caseStudiesAPI } from '../../api';

const CONFIG = {
    noun: 'case study', nouns: 'case studies', title: 'Case studies', description: 'Detailed project write-ups on the agency website',
    newPath: '/case-studies/new', newLabel: 'Add case study', editPath: c => `/case-studies/${c.id}/edit`,
    api: caseStudiesAPI, resultKey: 'caseStudies',
    thumb: () => null, subtitle: c => `/portfolio/${c.slug}`, category: c => c.category,
    extra: { header: 'Order', render: c => c.sortOrder ?? '—' },
};

export default function CaseStudiesList() {
    return <ContentList config={CONFIG} />;
}
