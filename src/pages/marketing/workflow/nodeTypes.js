import { ActionNode, ConditionNode, DelayNode, TriggerNode, WhatsappNode } from './nodes';

// Stable module-level map (React Flow re-mounts nodes if this object changes identity)
export const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode, delay: DelayNode, whatsapp: WhatsappNode };
