import { describe, it, expect } from 'vitest';
import { fromLead, toLeadPayload } from '../leadFields';

describe('lead form mapping', () => {
    it('round-trips leadSource so editing a lead keeps its source', () => {
        const lead = { id: 1, contactName: 'Asha', company: 'Asha Clinic', leadSource: 'Website', status: 'contacted', estimatedValue: 4800, score: 70 };
        const payload = toLeadPayload(fromLead(lead));
        expect(payload.leadSource).toBe('Website');
        expect(payload.company).toBe('Asha Clinic');
        expect(payload.estimatedValue).toBe(4800);
        expect(payload).not.toHaveProperty('source');
    });

    it('sends null, not 0, when no value is entered', () => {
        expect(toLeadPayload(fromLead({ contactName: 'X' })).estimatedValue).toBeNull();
    });
});
