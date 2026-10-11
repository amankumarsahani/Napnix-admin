import { describe, expect, it } from 'vitest';
import { buildSteps } from '../automationGraph';

const node = (id, type, actionType, label = id) => ({ id, type, data: { actionType, label, config: {} } });
const edge = (source, target, sourceHandle) => ({ source, target, sourceHandle });

describe('buildSteps', () => {
    it('walks a straight chain in order', () => {
        const { steps } = buildSteps(
            [node('t', 'trigger'), node('a', 'action', 'send_email'), node('b', 'action', 'wait')],
            [edge('t', 'a'), edge('a', 'b')],
        );
        expect(steps.map(s => s.type)).toEqual(['send_email', 'wait']);
    });

    it('writes yes branch, an end step, then the no branch, with 1-based branch positions', () => {
        const { steps } = buildSteps(
            [node('t', 'trigger'), node('c', 'condition', 'condition'), node('y', 'action', 'add_tag'), node('n', 'action', 'notify')],
            [edge('t', 'c'), edge('c', 'y', 'yes'), edge('c', 'n', 'no')],
        );
        expect(steps.map(s => s.type)).toEqual(['condition', 'add_tag', 'end', 'notify']);
        expect(steps[0]).toMatchObject({ yes_index: 2, no_index: 4 });
    });

    it('rejects rejoining paths, fan-out and loose nodes', () => {
        const base = [node('t', 'trigger'), node('c', 'condition', 'condition'), node('x', 'action', 'wait')];
        expect(buildSteps(base, [edge('t', 'c'), edge('c', 'x', 'yes'), edge('c', 'x', 'no')]).error).toMatch(/same step/);
        expect(buildSteps([node('t', 'trigger'), node('a', 'action', 'wait'), node('b', 'action', 'wait')], [edge('t', 'a'), edge('a', 'b'), edge('a', 'b')]).error).toBeTruthy();
        expect(buildSteps([node('t', 'trigger'), node('a', 'action', 'wait'), node('z', 'action', 'wait')], [edge('t', 'a')]).error).toMatch(/not connected/);
        expect(buildSteps([node('t', 'trigger')], []).error).toMatch(/at least one step/);
    });
});
