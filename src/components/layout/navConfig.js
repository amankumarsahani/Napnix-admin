import {
    FiBarChart2, FiUsers, FiSettings, FiBriefcase, FiZap, FiFileText, FiMail, FiMessageCircle,
    FiLayout, FiCreditCard, FiActivity, FiLayers, FiServer, FiHardDrive, FiDollarSign,
    FiLifeBuoy, FiSend, FiInbox, FiTool, FiTag, FiCode, FiBox, FiGlobe, FiRepeat, FiAtSign,
    FiImage, FiBookOpen, FiSmartphone, FiTrendingUp, FiHeart, FiShield,
} from 'react-icons/fi';

// Single source for navigation: Sidebar, CommandPalette and the header breadcrumb all read this.
// `roles` mirrors the route guards in App.jsx. `count` names a live counter (see useNavCounts).
const ADMIN = ['admin'];

export const NAV_GROUPS = [
    {
        id: 'main', title: 'Main',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: FiBarChart2, roles: ['admin', 'sales_operator'] },
            { name: 'Tenants', path: '/tenants', icon: FiLayers, roles: ADMIN },
            { name: 'Clients', path: '/clients', icon: FiUsers, roles: ['admin', 'user'] },
            { name: 'Projects', path: '/projects', icon: FiBriefcase, roles: ['admin', 'user'] },
            { name: 'Leads', path: '/leads', icon: FiZap, roles: ['admin', 'sales_operator'] },
        ],
    },
    {
        id: 'communication', title: 'Communication',
        items: [
            // Support route is admin-only in App.jsx, so sales operators no longer see a link that bounces them
            { name: 'Support Tickets', path: '/support', icon: FiLifeBuoy, roles: ADMIN, count: 'support' },
            { name: 'Inquiries', path: '/inquiries', icon: FiInbox, roles: ['admin', 'sales_operator'], count: 'inquiries' },
            { name: 'WhatsApp', path: '/whatsapp', icon: FiMessageCircle, roles: ADMIN },
            { name: 'Workflows', path: '/workflows', icon: FiActivity, roles: ADMIN },
            { name: 'Broadcasts (legacy)', path: '/campaigns', icon: FiSend, roles: ADMIN, keywords: 'campaigns', hidden: true },
            { name: 'SMTP Accounts (legacy)', path: '/smtp-accounts', icon: FiAtSign, roles: ADMIN, hidden: true },
        ],
    },
    {
        id: 'email', title: 'Email Marketing', hidden: true, // NexMail is not a shipped product: out of the sidebar and Cmd-K, routes and titles kept
        items: [
            { name: 'Overview', path: '/email-marketing', icon: FiTrendingUp, roles: ADMIN, end: true, crumb: 'Email Marketing' },
            { name: 'Contacts', path: '/email-marketing/contacts', icon: FiUsers, roles: ADMIN },
            { name: 'Email Templates', path: '/email-marketing/templates', icon: FiLayout, roles: ADMIN },
            { name: 'Email Campaigns', path: '/email-marketing/campaigns', icon: FiMail, roles: ADMIN },
            { name: 'Automations', path: '/email-marketing/automations', icon: FiRepeat, roles: ADMIN },
            { name: 'Sending Accounts', path: '/email-marketing/smtp', icon: FiAtSign, roles: ADMIN },
            { name: 'Domains', path: '/email-marketing/domains', icon: FiGlobe, roles: ADMIN },
        ],
    },
    {
        id: 'website', title: 'Website',
        items: [
            { name: 'Blogs', path: '/blogs', icon: FiFileText, roles: ADMIN },
            { name: 'Portfolio', path: '/portfolio', icon: FiImage, roles: ADMIN },
            { name: 'Case Studies', path: '/case-studies', icon: FiBookOpen, roles: ADMIN },
            { name: 'Site Analytics', path: '/site-analytics', icon: FiBarChart2, roles: ADMIN },
        ],
    },
    {
        id: 'infrastructure', title: 'Infrastructure',
        items: [
            { name: 'Servers', path: '/infrastructure/servers', icon: FiServer, roles: ADMIN },
            { name: 'Backups', path: '/infrastructure/backups', icon: FiHardDrive, roles: ADMIN },
            { name: 'Monitoring', path: '/monitoring', icon: FiActivity, roles: ADMIN },
            { name: 'Tenant Health', path: '/tenant-health', icon: FiHeart, roles: ADMIN },
            { name: 'Monitor Alerts', path: '/monitor-events', icon: FiShield, roles: ADMIN },
        ],
    },
    {
        id: 'system', title: 'System',
        items: [
            { name: 'Documents', path: '/documents', icon: FiFileText, roles: ['admin', 'sales_operator'] },
            { name: 'Templates', path: '/templates', icon: FiLayout, roles: ADMIN },
            { name: 'Transactions', path: '/transactions', icon: FiCreditCard, roles: ADMIN },
            { name: 'Expenses', path: '/expenses', icon: FiDollarSign, roles: ADMIN },
            { name: 'Pricing', path: '/pricing', icon: FiTag, roles: ADMIN },
            { name: 'Mobile App', path: '/mobile-app', icon: FiSmartphone, roles: ADMIN },
            { name: 'Telemetry', path: '/telemetry', icon: FiActivity, roles: ADMIN },
            { name: 'Tools', path: '/tools', icon: FiTool, roles: ADMIN },
            { name: 'API Docs', path: '/api-docs', icon: FiCode, roles: ADMIN },
            { name: 'UI Kit', path: '/dev/ui', icon: FiBox, roles: ADMIN },
            { name: 'Team', path: '/team', icon: FiUsers, roles: ADMIN },
            { name: 'Settings', path: '/settings', icon: FiSettings, roles: ADMIN },
        ],
    },
];

export const canSee = (item, role) => !item.roles || item.roles.includes(role || 'user');

/** Groups with only the items this role may see (empty groups dropped). */
export function navForRole(role) {
    return NAV_GROUPS
        .filter(group => !group.hidden)
        .map(group => ({ ...group, items: group.items.filter(item => !item.hidden && canSee(item, role)) }))
        .filter(group => group.items.length > 0);
}

const ALL_ITEMS = NAV_GROUPS.flatMap(group => group.items.map(item => ({ ...item, group: group.title })));

/** Nav item that owns a path (longest matching prefix), e.g. /workflows/12/edit -> Workflows. */
export function findNavItem(pathname) {
    return ALL_ITEMS
        .filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`))
        .sort((a, b) => b.path.length - a.path.length)[0] || null;
}
