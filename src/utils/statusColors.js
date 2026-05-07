const STATUS_COLORS = {
  client: {
    active: 'bg-green-100 text-green-800',
    prospect: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
  },
  lead: {
    new: 'bg-blue-100 text-blue-800 border-blue-200',
    contacted: 'bg-amber-100 text-amber-800 border-amber-200',
    qualified: 'bg-purple-100 text-purple-800 border-purple-200',
    won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    lost: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  tenant: {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    trial: 'bg-blue-100 text-blue-700 border-blue-200',
    suspended: 'bg-amber-100 text-amber-700 border-amber-200',
    past_due: 'bg-rose-100 text-rose-700 border-rose-200',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  project: {
    planning: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    'on-hold': 'bg-gray-100 text-gray-800',
  },
  campaign: {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    sending: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    paused: 'bg-orange-100 text-orange-700 border-orange-200',
    failed: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

const PROCESS_STATUS_COLORS = {
  running: 'bg-emerald-500',
  stopped: 'bg-slate-400',
  starting: 'bg-amber-500 animate-pulse',
  error: 'bg-rose-500',
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export function getStatusColor(entityType, status) {
  const colors = STATUS_COLORS[entityType] || {};
  return colors[status?.toLowerCase()] || 'bg-slate-100 text-slate-700';
}

export function getProcessStatusColor(status) {
  return PROCESS_STATUS_COLORS[status?.toLowerCase()] || 'bg-slate-400';
}

export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority?.toLowerCase()] || PRIORITY_COLORS.medium;
}

export function createStatusColorFn(entityType) {
  return (status) => getStatusColor(entityType, status);
}
