"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickSearchBarProps {
  /** Current search value (controlled) */
  value: string;

  /** Callback when search value changes (debounced) */
  onSearch: (query: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Whether search is loading */
  isLoading?: boolean;

  /** Debounce delay in milliseconds */
  debounceMs?: number;

  /** Optional CSS classes */
  className?: string;
}

/**
 * Debounced search input for quick question lookup
 *
 * Features:
 * - 150ms debounce for responsive search experience
 * - Clear button when text is present
 * - Loading indicator during search
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <QuickSearchBar
 *   value={query}
 *   onSearch={setQuery}
 *   isLoading={isSearching}
 *   placeholder="Search questions..."
 * />
 * ```
 */
export function QuickSearchBar({
  value,
  onSearch,
  placeholder = "Search questions",
  isLoading = false,
  debounceMs = 150,
  className,
}: QuickSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce search callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onSearch(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onSearch, value]);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Clear search
  const handleClear = useCallback(() => {
    setLocalValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="instructor-search-input"
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-20"
          aria-label="Search questions"
          aria-describedby={isLoading ? "search-status" : undefined}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {localValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {isLoading && (
        <span id="search-status" className="sr-only" role="status">
          Searching questions...
        </span>
      )}
    </div>
  );
}
