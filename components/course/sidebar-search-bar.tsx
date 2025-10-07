"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarSearchBarProps {
  /**
   * Current search query
   */
  value: string;

  /**
   * Handler for search query changes (debounced)
   */
  onChange: (query: string) => void;

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;

  /**
   * Placeholder text
   * @default "Search threads..."
   */
  placeholder?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * SidebarSearchBar - Debounced search input for filtering threads
 *
 * Features:
 * - Debounced input (300ms default) to avoid excessive filtering
 * - Clear button when query is not empty
 * - Keyboard shortcut: Cmd/Ctrl + K to focus (handled by parent)
 * - Search icon visual indicator
 * - Glass panel styling (QDS compliant)
 * - Accessible with proper ARIA labels
 *
 * Behavior:
 * - User types → visual feedback immediate
 * - After 300ms pause → calls onChange with debounced value
 * - Clear button → immediately clears and calls onChange("")
 *
 * @example
 * ```tsx
 * <SidebarSearchBar
 *   value={searchQuery}
 *   onChange={handleSearch}
 *   debounceMs={300}
 * />
 * ```
 */
export function SidebarSearchBar({
  value,
  onChange,
  debounceMs = 300,
  placeholder = "Search threads...",
  className,
}: SidebarSearchBarProps) {
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value (for external resets)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange callback
  const debouncedOnChange = useCallback(
    (query: string) => {
      const timer = setTimeout(() => {
        onChange(query);
      }, debounceMs);

      return () => clearTimeout(timer);
    },
    [onChange, debounceMs]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Debounce the onChange call
    const cleanup = debouncedOnChange(newValue);
    return cleanup;
  };

  // Handle clear button
  const handleClear = () => {
    setLocalValue("");
    onChange(""); // Immediate update
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 border-b border-glass",
        className
      )}
    >
      {/* Search Icon */}
      <Search
        className="h-4 w-4 text-muted-foreground flex-shrink-0"
        aria-hidden="true"
      />

      {/* Search Input */}
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-0",
          "glass-text"
        )}
        aria-label="Search threads"
        autoComplete="off"
        spellCheck="false"
      />

      {/* Clear Button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "flex-shrink-0 p-1 rounded hover:bg-glass-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
