import { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiUsers } from 'react-icons/fi';
import {
    Button, IconButton, Field, Input, Textarea, Select, Checkbox, Switch, SearchInput,
    Dialog, ConfirmDialog, PageHeader, Panel, StatCard, Avatar, Badge, StatusBadge, Tabs,
    SkeletonRows, EmptyState, ErrorState, QueryState, DataTable,
} from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';

// Living reference for the shared UI kit (admin revamp Phase 2). Admin-only route: /dev/ui
const ROWS = [
    { id: 1, name: 'Asha Clinic', owner: 'Ravi Mehta', status: 'active', value: 48000 },
    { id: 2, name: 'Bloom Salon', owner: 'Neha Kapoor', status: 'prospect', value: 12500 },
    { id: 3, name: 'Peak Coaching', owner: 'Arjun Rao', status: 'inactive', value: 0 },
];

const Section = ({ title, children }) => (
    <Panel title={title} className="mb-6">{children}</Panel>
);

export default function UiKit() {
    const { theme, toggleTheme } = useTheme();
    const [tab, setTab] = useState('overview');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [tableState, setTableState] = useState('data');

    return (
        <div className="max-w-6xl">
            <PageHeader
                title="UI kit"
                description="Shared components on the design tokens. Check both themes before shipping a page."
                actions={<Button onClick={toggleTheme}>Theme: {theme}</Button>}
            />

            <Section title="Buttons">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="primary"><FiPlus className="size-4" />Primary</Button>
                    <Button>Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger"><FiTrash2 className="size-4" />Danger</Button>
                    <Button variant="primary" loading>Saving</Button>
                    <Button disabled>Disabled</Button>
                    <Button size="sm">Small</Button>
                    <IconButton label="Edit"><FiEdit2 className="size-4" /></IconButton>
                    <IconButton label="Delete" variant="danger"><FiTrash2 className="size-4" /></IconButton>
                </div>
            </Section>

            <Section title="Form fields">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Business name" hint="As it appears on invoices." required>
                        <Input placeholder="Asha Clinic" />
                    </Field>
                    <Field label="Email" error="Enter a valid email address.">
                        <Input type="email" defaultValue="asha@" />
                    </Field>
                    <Field label="Industry">
                        <Select defaultValue="clinic">
                            <option value="clinic">Clinic</option>
                            <option value="salon">Salon</option>
                        </Select>
                    </Field>
                    <Field label="Search (debounced)" hint={`Last committed value: "${search}"`}>
                        <SearchInput value={search} onChange={setSearch} placeholder="Search clients" />
                    </Field>
                    <Field label="Notes" className="sm:col-span-2">
                        <Textarea placeholder="Anything the team should know" />
                    </Field>
                    <Checkbox label="Send welcome email" defaultChecked />
                    <Switch checked={enabled} onChange={setEnabled} label="Automation enabled" />
                </div>
            </Section>

            <Section title="Badges and avatars">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>Neutral</Badge><Badge tone="info">Info</Badge><Badge tone="success">Success</Badge>
                    <Badge tone="warning">Warning</Badge><Badge tone="danger">Danger</Badge>
                    <StatusBadge entity="lead" status="contacted" /><StatusBadge entity="tenant" status="past_due" />
                    <Avatar name="Ravi Mehta" size="sm" /><Avatar name="Neha Kapoor" /><Avatar name="Arjun" size="lg" />
                </div>
            </Section>

            <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <StatCard label="Open leads" value="128" hint="Across all sources" icon={<FiUsers className="size-4" />} />
                <StatCard label="Revenue this month" value="₹2,40,000" delta={{ value: '+8%', direction: 'up', label: 'vs last month' }} />
                <StatCard label="Overdue invoices" value="3" delta={{ value: '+2', direction: 'down', label: 'vs last week' }} />
            </div>

            <Section title="Tabs">
                <Tabs value={tab} onChange={setTab} tabs={[
                    { id: 'overview', label: 'Overview' }, { id: 'activity', label: 'Activity', count: 12 }, { id: 'files', label: 'Files' },
                ]} />
                <p className="mt-3 text-sm text-fg-muted">Active tab: {tab}. Use arrow keys to move between tabs.</p>
            </Section>

            <Panel
                title="Data table"
                flush
                className="mb-6"
                actions={
                    <Select value={tableState} onChange={e => setTableState(e.target.value)} className="h-8 w-36" aria-label="Table state">
                        <option value="data">With data</option><option value="loading">Loading</option>
                        <option value="empty">Empty</option><option value="error">Error</option>
                    </Select>
                }
            >
                <DataTable
                    caption="Example clients"
                    columns={[
                        { key: 'name', header: 'Client', render: r => <span className="font-medium">{r.name}</span> },
                        { key: 'owner', header: 'Owner', render: r => <span className="inline-flex items-center gap-2"><Avatar name={r.owner} size="sm" />{r.owner}</span> },
                        { key: 'status', header: 'Status', render: r => <StatusBadge entity="client" status={r.status} /> },
                        { key: 'value', header: 'Value', align: 'right', mono: true, render: r => `₹${r.value.toLocaleString('en-IN')}` },
                    ]}
                    rows={tableState === 'data' ? ROWS : []}
                    loading={tableState === 'loading'}
                    error={tableState === 'error' ? new Error('Network error') : null}
                    onRetry={() => setTableState('data')}
                    empty={<EmptyState title="No clients yet" description="Clients appear here once a lead is won." action={<Button variant="primary" size="sm">Add client</Button>} />}
                    onRowClick={() => {}}
                    actions={() => <IconButton label="Edit client" size="sm"><FiEdit2 className="size-3.5" /></IconButton>}
                />
            </Panel>

            <Section title="States">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-sm border border-border"><SkeletonRows rows={3} /></div>
                    <div className="rounded-sm border border-border"><EmptyState title="No tickets" description="You're all caught up." /></div>
                    <div className="rounded-sm border border-border"><ErrorState error={new Error('Request failed with status 500')} onRetry={() => {}} /></div>
                </div>
                <div className="mt-4 rounded-sm border border-border">
                    <QueryState query={{ isLoading: false, isError: false, data: [] }} empty={<EmptyState title="QueryState: empty branch" />}>
                        {data => <p>{data.length} items</p>}
                    </QueryState>
                </div>
            </Section>

            <Section title="Dialogs">
                <div className="flex gap-2">
                    <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
                    <Button variant="danger" onClick={() => setConfirmOpen(true)}>Delete something</Button>
                </div>
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    title="Edit client"
                    description="Changes are saved when you press Save."
                    footer={<><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => setDialogOpen(false)}>Save</Button></>}
                >
                    <Field label="Business name"><Input defaultValue="Asha Clinic" /></Field>
                </Dialog>
                <ConfirmDialog
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={() => setConfirmOpen(false)}
                    title="Delete this client?"
                    message="This removes the client and its notes. This can't be undone."
                    confirmText="Delete client"
                />
            </Section>
        </div>
    );
}
