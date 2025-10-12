"use client";

import { CheckCircle2, XCircle, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface BulkActionsToolbarProps {
  /** Number of items selected */
  selectedCount: number;

  /** Total number of selectable items */
  totalCount: number;

  /** Whether all items are selected */
  isAllSelected: boolean;

  /** Callback to toggle all selections */
  onToggleAll: () => void;

  /** Callback to clear all selections */
  onClearSelection: () => void;

  /** Callback for bulk endorse action */
  onBulkEndorse?: () => void;

  /** Callback for bulk flag action */
  onBulkFlag?: () => void;

  /** Callback for bulk resolve action */
  onBulkResolve?: () => void;

  /** Whether bulk action is in progress */
  isLoading?: boolean;

  /** Optional CSS classes */
  className?: string;
}

/**
 * Toolbar for bulk actions on selected items
 *
 * Provides batch operations for instructors to quickly process
 * multiple questions at once (endorse, flag, resolve).
 *
 * Features:
 * - Select all/none toggle
 * - Selection count indicator
 * - Bulk action buttons with loading states
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedCount={3}
 *   totalCount={20}
 *   isAllSelected={false}
 *   onToggleAll={() => toggleAll()}
 *   onClearSelection={() => clearAll()}
 *   onBulkEndorse={() => endorseSelected()}
 *   isLoading={isBulkEndorsing}
 * />
 * ```
 */
export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  isAllSelected,
  onToggleAll,
  onClearSelection,
  onBulkEndorse,
  onBulkFlag,
  onBulkResolve,
  isLoading = false,
  className,
}: BulkActionsToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border bg-card p-3",
        "transition-all duration-200",
        hasSelection ? "border-primary/50 bg-primary/5" : "border-border",
        className
      )}
      role="toolbar"
      aria-label="Bulk actions toolbar"
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onToggleAll}
          disabled={isLoading || totalCount === 0}
          aria-label={isAllSelected ? "Deselect all items" : "Select all items"}
        />
        <span className="text-sm font-medium">
          {hasSelection ? (
            <>
              <span className="text-primary">{selectedCount}</span> of {totalCount} selected
            </>
          ) : (
            `${totalCount} items`
          )}
        </span>
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            className="h-7 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {hasSelection && (
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Processing...</span>
            </div>
          )}

          {!isLoading && (
            <>
              {onBulkEndorse && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onBulkEndorse}
                  className="h-8"
                  aria-label={`Endorse ${selectedCount} selected items`}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Endorse ({selectedCount})
                </Button>
              )}

              {onBulkFlag && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkFlag}
                  className="h-8"
                  aria-label={`Flag ${selectedCount} selected items`}
                >
                  <Flag className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Flag
                </Button>
              )}

              {onBulkResolve && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkResolve}
                  className="h-8"
                  aria-label={`Resolve ${selectedCount} selected items`}
                >
                  <XCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Resolve
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
