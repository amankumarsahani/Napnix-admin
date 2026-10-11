import { FiMail, FiPlus } from 'react-icons/fi';
import { Avatar, cx } from '../../components/ui';

const COLUMNS = [
    { id: 'new', title: 'New Leads', dot: 'bg-accent' },
    { id: 'contacted', title: 'In Discussion', dot: 'bg-warning' },
    { id: 'qualified', title: 'Qualified', dot: 'bg-accent' },
    { id: 'won', title: 'Closed Won', dot: 'bg-success' },
];

const inr = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const scoreTone = s => (s >= 80 ? 'text-success bg-success-soft' : s >= 50 ? 'text-warning bg-warning-soft' : 'text-danger bg-danger-soft');

/** Pipeline board. Cards open the lead; "Add Deal" opens the form preset to that column. */
export default function LeadsKanban({ leads = [], onOpen, onAdd }) {
    return (
        <div className="flex overflow-x-auto gap-4 pb-4 h-[calc(100dvh-220px)] min-h-96">
            {COLUMNS.map(col => {
                const colLeads = leads.filter(l => l.status?.toLowerCase() === col.id);
                const total = colLeads.reduce((sum, l) => sum + (parseFloat(l.estimatedValue) || 0), 0);
                return (
                    <section key={col.id} aria-label={col.title} className="min-w-72 w-72 flex flex-col">
                        <header className="flex items-center justify-between mb-2 px-1">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
                                <span aria-hidden="true" className={cx('size-2 rounded-full', col.dot)} />
                                {col.title}
                                <span className="font-mono tabular-nums text-2xs text-fg-subtle">{colLeads.length}</span>
                            </h2>
                            <span className="font-mono tabular-nums text-xs text-fg-subtle">{inr(total)}</span>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-md border border-border bg-surface-2 p-2 space-y-2">
                            {colLeads.map(lead => (
                                <button
                                    key={lead.id}
                                    type="button"
                                    onClick={() => onOpen(lead)}
                                    className="w-full text-left rounded-sm border border-border bg-surface p-3 hover:border-border-strong transition-colors"
                                >
                                    <span className="flex items-start justify-between gap-2">
                                        <span className="text-xs font-medium text-fg-subtle truncate">{lead.company || '—'}</span>
                                        {lead.score > 0 && (
                                            <span className={cx('shrink-0 rounded-sm px-1.5 font-mono tabular-nums text-2xs font-medium', scoreTone(lead.score))}>{lead.score}</span>
                                        )}
                                    </span>
                                    <span className="block mt-1 text-sm font-medium text-fg">{lead.contactName}</span>
                                    {lead.email && (
                                        <span className="flex items-center gap-1.5 mt-1 text-xs text-fg-muted">
                                            <FiMail aria-hidden="true" className="size-3 shrink-0" />
                                            <span className="truncate">{lead.email}</span>
                                        </span>
                                    )}
                                    <span className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                                        <span className="font-mono tabular-nums text-sm text-fg">{inr(lead.estimatedValue)}</span>
                                        <Avatar name={lead.contactName} size="sm" />
                                    </span>
                                </button>
                            ))}

                            {colLeads.length === 0 && (
                                <p className="h-20 grid place-items-center rounded-sm border border-dashed border-border text-sm text-fg-subtle">No leads</p>
                            )}

                            <button
                                type="button"
                                onClick={() => onAdd(col.id)}
                                className="w-full h-8 flex items-center justify-center gap-1.5 rounded-sm text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface"
                            >
                                <FiPlus aria-hidden="true" className="size-4" />Add Deal
                            </button>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
