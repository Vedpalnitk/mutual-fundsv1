/**
 * Barrel re-export — all domain API namespaces + core utilities
 *
 * Existing imports like `import { bseApi } from '@/services/api'` continue to
 * resolve to the parent `api.ts`, which re-exports everything from here.
 */
export * from './auth'
export * from './funds'
export * from './clients'
export * from './advisor'
export * from './bse'
export * from './nmf'
export * from './admin'
