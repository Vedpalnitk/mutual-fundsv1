import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Returns the effective advisor ID for FA-scoped queries.
 * If the user is fa_staff, returns their owner's (the advisor's) ID.
 * Otherwise, returns the user's own ID.
 */
export function getEffectiveAdvisorId(user: AuthenticatedUser): string {
  return user.role === 'fa_staff' && user.ownerId ? user.ownerId : user.id;
}
