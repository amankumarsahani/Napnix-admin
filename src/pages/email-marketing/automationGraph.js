// Canvas graph <-> the ordered steps NexMail stores.
//
// The worker advances by step_order, and only a condition jumps (yes_step_id / no_step_id). So a graph is
// saved as a depth-first walk from the trigger: a condition's yes-branch is written first, then an explicit
// `end` step, then the no-branch. Two branches that rejoin, or a step that fans out, can't be expressed; we
// report that instead of saving something that would run differently from what the canvas shows.

/** @returns {{ steps?: object[], error?: string }} */
export function buildSteps(nodes, edges) {
    const trigger = nodes.find(n => n.type === 'trigger');
    if (!trigger) return { error: 'Add a trigger node' };
    const byId = new Map(nodes.map(n => [n.id, n]));
    const out = id => edges.filter(e => e.source === id);
    const steps = [];
    const seen = new Set([trigger.id]);

    const walk = id => {
        if (seen.has(id)) return 'Two paths lead to the same step. Paths cannot rejoin, so duplicate the step instead.';
        seen.add(id);
        const node = byId.get(id);
        if (!node) return null;
        const idx = steps.length;
        steps.push({ type: node.data.actionType, config: node.data.config || {} });
        const edgesOut = out(id);
        if (node.type === 'condition') {
            const yes = edgesOut.find(e => e.sourceHandle === 'yes');
            const no = edgesOut.find(e => e.sourceHandle === 'no');
            if (yes) {
                steps[idx].yes_index = steps.length + 1;
                const err = walk(yes.target);
                if (err) return err;
                if (no) steps.push({ type: 'end', config: {} }); // stop the yes-branch before the no-branch begins
            }
            if (no) {
                steps[idx].no_index = steps.length + 1;
                return walk(no.target);
            }
            return null;
        }
        if (edgesOut.length > 1) return `“${node.data.label}” has ${edgesOut.length} outgoing connections. Only conditions can branch.`;
        return edgesOut.length ? walk(edgesOut[0].target) : null;
    };

    const first = out(trigger.id);
    if (first.length > 1) return { error: 'The trigger can only connect to one step' };
    if (first.length) {
        const err = walk(first[0].target);
        if (err) return { error: err };
    }
    const loose = nodes.filter(n => !seen.has(n.id));
    if (loose.length) return { error: `${loose.length} node${loose.length === 1 ? ' is' : 's are'} not connected to the trigger` };
    if (!steps.length) return { error: 'Add at least one step after the trigger' };
    return { steps };
}

const STEP_X = 300;
/**
 * Rebuild a canvas from stored steps when no saved layout exists: a straight chain, with a condition's
 * yes/no targets wired by step id.
 */
export function stepsToGraph(steps, triggerNode) {
    const nodes = [triggerNode];
    const edges = [];
    const edgeStyle = { type: 'smoothstep', animated: true, style: { strokeWidth: 2 } };
    const idOf = s => `step-${s.id}`;
    steps.forEach((s, i) => {
        nodes.push({
            id: idOf(s),
            type: s.type === 'condition' ? 'condition' : 'action',
            position: { x: STEP_X, y: 200 + i * 130 },
            data: { label: s.type.replace(/_/g, ' '), actionType: s.type, config: typeof s.config === 'string' ? safeParse(s.config) : (s.config || {}) },
        });
    });
    const link = (source, target, sourceHandle) => edges.push({ id: `e-${source}-${target}-${sourceHandle || 'd'}`, source, target, sourceHandle, ...edgeStyle });
    if (steps.length) link(triggerNode.id, idOf(steps[0]));
    steps.forEach((s, i) => {
        if (s.type === 'condition') {
            const yes = steps.find(x => x.id === s.yes_step_id);
            const no = steps.find(x => x.id === s.no_step_id);
            if (yes) link(idOf(s), idOf(yes), 'yes');
            if (no) link(idOf(s), idOf(no), 'no');
        } else if (s.type !== 'end' && steps[i + 1]) {
            link(idOf(s), idOf(steps[i + 1]));
        }
    });
    return { nodes, edges };
}

function safeParse(v) { try { return JSON.parse(v); } catch { return {}; } }
