import { useState, useEffect } from 'react';

/**
 * Hook to detect viewport size using matchMedia API
 *
 * Provides reactive viewport detection with automatic cleanup.
 * Uses native matchMedia API for efficient, browser-native media query matching.
 *
 * @param query - Media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the query currently matches
 *
 * @example
 * ```tsx
 * // Detect mobile viewport
 * const isMobile = useMediaQuery('(max-width: 767px)');
 *
 * // Detect dark mode preference
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * // Use in conditional rendering
 * return isMobile ? <MobileView /> : <DesktopView />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers support addEventListener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    // Legacy fallback for older browsers (deprecated but supported)
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}
