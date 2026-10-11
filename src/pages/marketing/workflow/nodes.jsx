import { Handle, Position } from '@xyflow/react';
import { FiClock, FiGitBranch, FiMessageCircle, FiPlay, FiZap } from 'react-icons/fi';
import { cx } from '../../../components/ui';
import { nodeKindLabel } from './palette';

// One card for every node kind. Colour = kind (token tones), never the only signal: each card also
// carries its kind label. Selection uses the accent outline.
const KINDS = {
    trigger: { label: 'Trigger', Icon: FiPlay, chip: 'bg-success-soft text-success', handle: '!bg-success' },
    action: { label: 'Action', Icon: FiZap, chip: 'bg-accent-soft text-accent', handle: '!bg-accent' },
    condition: { label: 'Condition', Icon: FiGitBranch, chip: 'bg-warning-soft text-warning', handle: '!bg-warning' },
    delay: { label: 'Delay', Icon: FiClock, chip: 'bg-surface-3 text-fg-muted', handle: '!bg-fg-subtle' },
    whatsapp: { label: 'WhatsApp', Icon: FiMessageCircle, chip: 'bg-success-soft text-success', handle: '!bg-success' },
};
const HANDLE = 'size-2.5 !border-2 !border-surface';

/** One line under the label: the most useful thing about this node's config. */
function summarize(kind, data) {
    const c = data.config || {};
    if (kind === 'trigger') {
        if (data.triggerType === 'scheduled') return [c.schedule_type, c.schedule_time && `@ ${c.schedule_time}`].filter(Boolean).join(' ');
        if (c.source_filter) return `Source: ${c.source_filter}`;
        return nodeKindLabel(data.triggerType);
    }
    if (kind === 'condition') return c.field ? `${c.field} ${String(c.operator || '').replace(/_/g, ' ')} ${c.value ?? ''}`.trim() : 'Not configured';
    if (kind === 'delay') return c.value ? `Wait ${c.value} ${c.unit || ''}`.trim() : 'Not configured';
    switch (data.actionType) {
        case 'send_email': return c.subject ? `“${c.subject}”` : 'Send email';
        case 'add_note': return c.content ? `“${c.content}”` : 'Add note';
        case 'create_task': return c.title ? `Task: ${c.title}` : 'Create task';
        case 'ai_assistant': return c.model || 'AI assistant';
        case 'ai_write_blog': return `${c.word_count || 1000} words, ${c.tone || 'professional'}`;
        case 'ai_post_blog': return `${c.author || 'AI Writer'}, ${c.status || 'draft'}`;
        case 'ai_pick_topic': return c.niche ? `Niche: ${c.niche}` : 'Pick topic';
        case 'ai_fetch_image': return c.query ? `Query: ${c.query}` : 'Fetch image';
        default: return nodeKindLabel(data.actionType);
    }
}

function NodeCard({ kind, data, selected }) {
    const k = KINDS[kind] || KINDS.action;
    const { Icon } = k;
    const raw = summarize(kind, data);
    const summary = raw && raw !== data.label ? raw : '';
    return (
        <div className={cx(
            'w-52 rounded-md border bg-surface px-3 py-2.5 shadow-pop',
            selected ? 'border-accent outline outline-2 outline-accent/40' : 'border-border-strong'
        )}>
            {kind !== 'trigger' && <Handle type="target" position={Position.Top} className={cx(HANDLE, k.handle)} />}
            <div className="flex items-center gap-2">
                <span className={cx('grid size-6 shrink-0 place-items-center rounded-sm', k.chip)} aria-hidden="true"><Icon className="size-3.5" /></span>
                <span className="text-2xs font-medium uppercase tracking-wide text-fg-subtle">{k.label}</span>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-fg" title={data.label}>{data.label || 'Untitled'}</p>
            {summary && <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{summary}</p>}

            {kind === 'condition' ? (
                <>
                    <div className="mt-2 flex justify-between text-2xs font-medium">
                        <span className="text-success">Yes</span>
                        <span className="text-danger">No</span>
                    </div>
                    <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '25%' }} className={cx(HANDLE, '!bg-success')} />
                    <Handle type="source" position={Position.Bottom} id="no" style={{ left: '75%' }} className={cx(HANDLE, '!bg-danger')} />
                </>
            ) : (
                <Handle type="source" position={Position.Bottom} className={cx(HANDLE, k.handle)} />
            )}
            {data.config?.on_error === 'branch' && (
                <Handle type="source" position={Position.Right} id="error" title="On error" className={cx(HANDLE, '!bg-danger')} />
            )}
        </div>
    );
}

export const TriggerNode = props => <NodeCard kind="trigger" {...props} />;
export const ActionNode = props => <NodeCard kind="action" {...props} />;
export const ConditionNode = props => <NodeCard kind="condition" {...props} />;
export const DelayNode = props => <NodeCard kind="delay" {...props} />;
export const WhatsappNode = props => <NodeCard kind="whatsapp" {...props} />;
