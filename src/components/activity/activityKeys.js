// Shared React Query key for an entity's activity timeline (see ActivityTimeline).
export const activityQueryKey = (entityType, entityId) => ['activities', entityType, String(entityId)];
