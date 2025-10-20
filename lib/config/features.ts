// ============================================
// Feature Flag System
// ============================================
//
// Enables gradual backend migration with per-module toggles.
// Set NEXT_PUBLIC_USE_BACKEND=true to enable backend globally,
// then toggle individual modules for testing.

export interface FeatureFlags {
  // Master toggle
  useBackend: boolean;

  // Per-module toggles (only apply if useBackend is true)
  auth: boolean;
  courses: boolean;
  materials: boolean;
  threads: boolean;
  posts: boolean;
  aiAnswers: boolean;
  conversations: boolean;
  instructor: boolean;
  notifications: boolean;

  // API configuration
  apiUrl: string;
}

/**
 * Load feature flags from environment variables
 */
function loadFeatureFlags(): FeatureFlags {
  // Master toggle (must be true for any backend usage)
  const useBackend = process.env.NEXT_PUBLIC_USE_BACKEND === 'true';

  return {
    // Master toggle
    useBackend,

    // Per-module flags (only apply if master toggle is true)
    auth: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_AUTH !== 'false'),
    courses: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_COURSES !== 'false'),
    materials: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_MATERIALS !== 'false'),
    threads: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_THREADS !== 'false'),
    posts: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_POSTS !== 'false'),
    aiAnswers: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_AI_ANSWERS !== 'false'),
    conversations: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_CONVERSATIONS !== 'false'),
    instructor: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_INSTRUCTOR !== 'false'),
    notifications: useBackend && (process.env.NEXT_PUBLIC_USE_BACKEND_NOTIFICATIONS !== 'false'),

    // API URL
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  };
}

/**
 * Get current feature flags (singleton)
 */
let cachedFlags: FeatureFlags | null = null;

export function getFeatureFlags(): FeatureFlags {
  if (!cachedFlags) {
    cachedFlags = loadFeatureFlags();

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Feature Flags]', cachedFlags);
    }
  }

  return cachedFlags;
}

/**
 * Check if a specific module should use backend
 */
export function useBackendFor(module: keyof Omit<FeatureFlags, 'useBackend' | 'apiUrl'>): boolean {
  const flags = getFeatureFlags();
  return flags.useBackend && flags[module];
}

/**
 * Get backend API URL
 */
export function getAPIUrl(): string {
  return getFeatureFlags().apiUrl;
}
