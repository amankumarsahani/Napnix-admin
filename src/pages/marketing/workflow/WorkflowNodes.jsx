import { Handle, Position } from '@xyflow/react';

const WaIcon = () => (
    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

export const TriggerNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-green-500'
        } bg-white dark:bg-slate-800`}>
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Trigger</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>

        {data.config && Object.keys(data.config).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {data.triggerType === 'lead_created' && data.config.source_filter && (
                    <div className="text-[10px] text-slate-500 line-clamp-1">Source: {data.config.source_filter}</div>
                )}
                {data.triggerType === 'scheduled' && (
                    <div className="text-[10px] text-slate-500 line-clamp-1">{data.config.schedule_type} @ {data.config.schedule_time}</div>
                )}
            </div>
        )}

        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

export const ActionNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-blue-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Action</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>

        {data.config && Object.keys(data.config).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {data.actionType === 'send_email' && (
                    <div className="text-[10px] text-slate-500 line-clamp-1 italic">"{data.config.subject}"</div>
                )}
                {data.actionType === 'add_note' && (
                    <div className="text-[10px] text-slate-500 line-clamp-2 italic">"{data.config.content}"</div>
                )}
                {data.actionType === 'ai_assistant' && (
                    <div className="text-[10px] text-brand-500 font-medium">{data.config.model}</div>
                )}
                {data.actionType === 'create_task' && (
                    <div className="text-[10px] text-slate-500 line-clamp-1">Task: {data.config.title}</div>
                )}
                {data.actionType === 'ai_pick_topic' && data.config.niche && (
                    <div className="text-[10px] text-pink-500 font-medium">Niche: {data.config.niche}</div>
                )}
                {data.actionType === 'ai_write_blog' && (
                    <div className="text-[10px] text-pink-500 font-medium">{data.config.word_count || 1000} words • {data.config.tone || 'professional'}</div>
                )}
                {data.actionType === 'ai_fetch_image' && data.config.query && (
                    <div className="text-[10px] text-orange-500 font-medium">Query: {data.config.query}</div>
                )}
                {data.actionType === 'ai_post_blog' && (
                    <div className="text-[10px] text-red-500 font-medium">
                        {data.config.author || 'AI Writer'} • {data.config.status || 'draft'}
                    </div>
                )}
            </div>
        )}

        {data.actionType && !data.config?.content && !data.config?.subject && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.actionType}</div>
        )}
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

export const WhatsAppNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-emerald-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-emerald-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <WaIcon />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">WhatsApp</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>
        {data.config?.to_phone && (
            <div className="mt-1 text-[10px] text-slate-400 truncate">To: {data.config.to_phone}</div>
        )}
        {data.config?.message && (
            <div className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 italic truncate">
                "{data.config.message.slice(0, 40)}{data.config.message.length > 40 ? '…' : ''}"
            </div>
        )}
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-emerald-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

export const ConditionNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-amber-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Condition</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>

        {data.config && data.config.field && (
            <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium line-clamp-1">
                {data.config.field} {data.config.operator?.replace('_', ' ')} {data.config.value}
            </div>
        )}

        <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600 font-medium">Yes</span>
            <span className="text-red-600 font-medium">No</span>
        </div>
        <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '25%' }}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white dark:!border-slate-800"
        />
        <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ left: '75%' }}
            className="w-3 h-3 !bg-red-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

export const DelayNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-purple-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Delay</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>

        {data.config && data.config.value && (
            <div className="mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium text-center line-clamp-1">
                Wait {data.config.value} {data.config.unit}
            </div>
        )}

        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);
