/**
 * Backend Integration Feature Flags
 *
 * Controls which API modules use the real backend vs mock data.
 * This replaces the useBackendFor() hook to avoid React Hooks violations
 * when called from plain async functions.
 *
 * Usage:
 *   import { BACKEND_FEATURE_FLAGS } from '@/lib/config/backend';
 *   const useBackend = BACKEND_FEATURE_FLAGS.auth;
 */

export const BACKEND_FEATURE_FLAGS = {
  auth: process.env.NEXT_PUBLIC_USE_BACKEND_AUTH === 'true',
  threads: process.env.NEXT_PUBLIC_USE_BACKEND_THREADS === 'true',
  posts: process.env.NEXT_PUBLIC_USE_BACKEND_POSTS === 'true',
  courses: process.env.NEXT_PUBLIC_USE_BACKEND_COURSES === 'true',
  materials: process.env.NEXT_PUBLIC_USE_BACKEND_MATERIALS === 'true',
  aiAnswers: process.env.NEXT_PUBLIC_USE_BACKEND_AI_ANSWERS === 'true',
  conversations: process.env.NEXT_PUBLIC_USE_BACKEND_CONVERSATIONS === 'true',
  instructor: process.env.NEXT_PUBLIC_USE_BACKEND_INSTRUCTOR === 'true',
  notifications: process.env.NEXT_PUBLIC_USE_BACKEND_NOTIFICATIONS === 'true',
} as const;

/**
 * Global backend toggle
 * When true, enables all backend modules (overrides individual flags)
 */
export const USE_BACKEND_GLOBAL = process.env.NEXT_PUBLIC_USE_BACKEND === 'true';

/**
 * Helper to check if a module should use backend
 */
export function shouldUseBackend(module: keyof typeof BACKEND_FEATURE_FLAGS): boolean {
  return USE_BACKEND_GLOBAL || BACKEND_FEATURE_FLAGS[module];
}
