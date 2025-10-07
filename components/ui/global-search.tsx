"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "lucide-react";
import { debounce, isValidQuery, type SearchResult } from "@/lib/utils/search";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface GlobalSearchProps {
  /**
   * Placeholder text for search input
   */
  placeholder?: string;

  /**
   * Debounce delay in milliseconds (default: 300ms)
   */
  debounceMs?: number;

  /**
   * Maximum results to display (default: 10)
   */
  maxResults?: number;

  /**
   * Custom search function (optional)
   */
  onSearch?: (query: string) => Promise<SearchResult[]>;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * Global search component with W3C combobox pattern
 * Implements full keyboard navigation and screen reader support
 */
export function GlobalSearch({
  placeholder = "Search threads...",
  debounceMs = 300,
  maxResults = 10,
  onSearch,
  className,
}: GlobalSearchProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Component state
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: "/" to focus search
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if "/" is pressed and not inside an input/textarea
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (!isValidQuery(searchQuery)) {
          setSuggestions([]);
          setIsLoading(false);
          setStatusMessage('');
          return;
        }

        setIsLoading(true);
        setStatusMessage('Searching...');

        try {
          // Use custom search function if provided, otherwise use mock
          const results = onSearch
            ? await onSearch(searchQuery)
            : await mockSearch(searchQuery);

          setSuggestions(results.slice(0, maxResults));
          setShowSuggestions(true);
          setActiveIndex(-1);

          // Announce results count
          const count = results.length;
          setStatusMessage(
            count > 0
              ? `${count} result${count === 1 ? '' : 's'} found`
              : `No results found for "${searchQuery}"`
          );

          // Clear status message after 5 seconds
          setTimeout(() => setStatusMessage(''), 5000);
        } catch (error) {
          console.error('Search error:', error);
          setStatusMessage('Search failed. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }, debounceMs),
    [debounceMs, maxResults, onSearch]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showSuggestions && suggestions.length > 0) {
          setShowSuggestions(true);
        }
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        } else if (query) {
          // Navigate to search results page
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setActiveIndex(-1);
        if (query) {
          setQuery('');
          setStatusMessage('Search cleared');
          setTimeout(() => setStatusMessage(''), 3000);
        }
        break;

      case 'Home':
        if (showSuggestions) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;

      case 'End':
        if (showSuggestions) {
          e.preventDefault();
          setActiveIndex(suggestions.length - 1);
        }
        break;

      case 'Tab':
        // Allow default tab behavior
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;

      default:
        // Reset active index when typing
        setActiveIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSelect = (item: SearchResult) => {
    // Close suggestions
    setShowSuggestions(false);
    setActiveIndex(-1);

    // Update input value
    setQuery(item.title);

    // Announce selection
    setStatusMessage(`Selected: ${item.title}`);
    setTimeout(() => setStatusMessage(''), 3000);

    // Navigate
    router.push(item.url);
  };

  // Handle clear button
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setStatusMessage('Search cleared');
    setTimeout(() => setStatusMessage(''), 3000);

    // Return focus to input
    inputRef.current?.focus();
  };

  // Handle blur (delayed to allow click on suggestion)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const currentTarget = e.currentTarget;
    setTimeout(() => {
      if (currentTarget && !currentTarget.contains(document.activeElement)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }, 200);
  };

  return (
    <form
      role="search"
      className={cn("global-search relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (query) {
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      }}
    >
      {/* Label - visually hidden but available to screen readers */}
      <label htmlFor="global-search-input" className="sr-only">
        Search courses and threads
      </label>

      <div className="search-container relative">
        {/* Input with combobox role */}
        <Input
          id="global-search-input"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
          aria-activedescendant={
            activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
          aria-label="Search courses and threads"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={handleBlur}
          className="h-10 pl-10 pr-20 rounded-lg glass-panel border-glass focus:ring-2 focus:ring-primary/50 focus:border-primary focus:shadow-[var(--glow-primary)] transition-all"
        />

        {/* Search icon - decorative */}
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />

        {/* Keyboard hint - "/" key */}
        {!query && (
          <kbd
            className="hidden md:inline-flex absolute right-10 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-glass-subtle px-1.5 py-0.5 text-xs text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            <span>/</span>
          </kbd>
        )}

        {/* Clear button - appears when input has value */}
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-glass-strong transition-colors"
          >
            <X className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className={cn(
            "suggestions-list absolute top-full left-0 right-0 mt-2 glass-panel-strong rounded-lg shadow-e2 max-h-96 overflow-auto z-50",
            !prefersReducedMotion && "animate-in fade-in-0 slide-in-from-top-2 duration-200"
          )}
        >
          {isLoading ? (
            <li role="option" aria-selected={false} className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="inline animate-spin mr-2 size-4" aria-hidden="true" />
              Searching...
            </li>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <li
                key={item.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "suggestion-item px-4 py-3 cursor-pointer border-b border-glass last:border-0 transition-colors hover:bg-glass-strong",
                  index === activeIndex && "bg-glass-strong"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium glass-text truncate">{item.title}</p>
                    {item.courseName && (
                      <p className="text-xs text-muted-foreground glass-text mt-0.5 truncate">
                        {item.courseName}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {item.type}
                  </Badge>
                </div>
              </li>
            ))
          ) : query ? (
            <li role="option" aria-selected={false} className="p-4 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </li>
          ) : null}
        </ul>
      )}

      {/* Loading/status announcements - screen reader only */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
    </form>
  );
}

// ============================================
// Mock Search Function (for demonstration)
// ============================================

/**
 * Mock search function - replace with real API call
 */
async function mockSearch(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock results based on query
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'How do JavaScript closures work?',
      content: 'I need help understanding closures...',
      score: 100,
      type: 'thread',
      courseName: 'CS101',
      url: '/threads/1',
    },
    {
      id: '2',
      title: 'React hooks best practices',
      content: 'What are the best practices for using hooks?',
      score: 90,
      type: 'thread',
      courseName: 'WEBDEV301',
      url: '/threads/2',
    },
    {
      id: '3',
      title: 'Understanding async/await',
      content: 'How does async/await differ from promises?',
      score: 80,
      type: 'thread',
      courseName: 'CS101',
      url: '/threads/3',
    },
  ];

  // Simple filter based on query
  return mockResults.filter((result) =>
    result.title.toLowerCase().includes(query.toLowerCase())
  );
}
