// Semantic tones on design tokens (index.css), so badges work in light and dark with one class.
// Meaning is carried by the badge label too; colour is never the only signal.
export const TONE = {
  neutral: 'bg-surface-3 text-fg-muted border-border',
  info: 'bg-accent-soft text-accent border-accent/25',
  success: 'bg-success-soft text-success border-success/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
};

const STATUS_COLORS = {
  client: { active: TONE.success, prospect: TONE.info, inactive: TONE.neutral },
  lead: { new: TONE.info, contacted: TONE.warning, qualified: TONE.info, negotiation: TONE.warning, won: TONE.success, lost: TONE.danger },
  tenant: { active: TONE.success, trial: TONE.info, suspended: TONE.warning, past_due: TONE.danger, cancelled: TONE.neutral },
  inquiry: { new: TONE.info, contacted: TONE.warning, resolved: TONE.neutral, converted: TONE.success },
  ticket: { open: TONE.info, in_progress: TONE.warning, waiting_customer: TONE.neutral, resolved: TONE.success, closed: TONE.neutral },
  ticketPriority: { low: TONE.neutral, medium: TONE.info, high: TONE.warning, urgent: TONE.danger },
  project: { planning: TONE.info, 'in-progress': TONE.warning, completed: TONE.success, 'on-hold': TONE.neutral },
  execution: { pending: TONE.neutral, running: TONE.info, waiting: TONE.warning, completed: TONE.success, failed: TONE.danger, cancelled: TONE.neutral, skipped: TONE.neutral },
  campaign: {
    draft: TONE.neutral, scheduled: TONE.info, sending: TONE.warning,
    completed: TONE.success, paused: TONE.warning, failed: TONE.danger,
  },
};

const PROCESS_STATUS_COLORS = {
  running: 'bg-success',
  stopped: 'bg-fg-subtle',
  starting: 'bg-warning animate-pulse',
  error: 'bg-danger',
};

const PRIORITY_COLORS = { low: TONE.success, medium: TONE.warning, high: TONE.danger };

export function getStatusColor(entityType, status) {
  const colors = STATUS_COLORS[entityType] || {};
  return colors[status?.toLowerCase()] || TONE.neutral;
}

export function getProcessStatusColor(status) {
  return PROCESS_STATUS_COLORS[status?.toLowerCase()] || 'bg-fg-subtle';
}

export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority?.toLowerCase()] || PRIORITY_COLORS.medium;
}

export function createStatusColorFn(entityType) {
  return (status) => getStatusColor(entityType, status);
}
