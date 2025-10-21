"use client";

/**
 * Branch Component - Message branching for AI responses
 *
 * Based on AI Elements Branch component
 * Manages multiple versions of messages with navigation
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
  useCallback,
} from "react";

// Branch Context
interface BranchContextValue {
  currentBranch: number;
  totalBranches: number;
  goToNext: () => void;
  goToPrevious: () => void;
  setBranch: (index: number) => void;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("Branch components must be used within <Branch />");
  }
  return context;
}

// Branch Container
export interface BranchProps {
  /** Default branch index to show */
  defaultBranch?: number;
  /** Callback when branch changes */
  onBranchChange?: (branchIndex: number) => void;
  /** Children (BranchMessages and BranchSelector) */
  children: ReactNode;
  /** Custom className */
  className?: string;
}

export function Branch({
  defaultBranch = 0,
  onBranchChange,
  children,
  className,
}: BranchProps) {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);

  // Count total branches from children
  const branches = Array.isArray(children) ? children : [children];
  const totalBranches = branches.filter(
    (child) => child && typeof child === "object" && "type" in child && child.type === BranchMessages
  ).length;

  const setBranch = useCallback(
    (index: number) => {
      const newIndex = Math.max(0, Math.min(index, totalBranches - 1));
      setCurrentBranch(newIndex);
      onBranchChange?.(newIndex);
    },
    [totalBranches, onBranchChange]
  );

  const goToNext = useCallback(() => {
    setBranch(currentBranch + 1);
  }, [currentBranch, setBranch]);

  const goToPrevious = useCallback(() => {
    setBranch(currentBranch - 1);
  }, [currentBranch, setBranch]);

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        totalBranches,
        goToNext,
        goToPrevious,
        setBranch,
      }}
    >
      <div className={className}>{children}</div>
    </BranchContext.Provider>
  );
}

// Branch Messages Container
export interface BranchMessagesProps {
  /** Branch index */
  branchIndex?: number;
  /** Messages for this branch */
  children: ReactNode;
  /** Custom className */
  className?: string;
}

export function BranchMessages({
  branchIndex = 0,
  children,
  className,
}: BranchMessagesProps) {
  const { currentBranch } = useBranch();
  const isVisible = currentBranch === branchIndex;

  return (
    <div
      className={cn(className, !isVisible && "hidden")}
      aria-hidden={!isVisible}
    >
      {children}
    </div>
  );
}

// Branch Selector (Navigation UI)
export interface BranchSelectorProps {
  /** Message role to determine alignment */
  from: UIMessage["role"];
  /** Custom className */
  className?: string;
  /** Children (BranchPrevious, BranchPage, BranchNext) */
  children: ReactNode;
}

export function BranchSelector({
  from,
  className,
  children,
}: BranchSelectorProps) {
  const alignmentClass =
    from === "user" ? "justify-end" : from === "assistant" ? "justify-start" : "justify-center";

  return (
    <div
      className={cn(
        "flex items-center gap-1 mt-2",
        alignmentClass,
        className
      )}
      role="navigation"
      aria-label="Navigate message branches"
    >
      {children}
    </div>
  );
}

// Branch Previous Button
export interface BranchPreviousProps {
  /** Custom className */
  className?: string;
}

export function BranchPrevious({ className }: BranchPreviousProps) {
  const { currentBranch, goToPrevious } = useBranch();
  const isDisabled = currentBranch === 0;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={goToPrevious}
      disabled={isDisabled}
      className={cn("h-7 w-7 p-0", className)}
      aria-label="Previous branch"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );
}

// Branch Next Button
export interface BranchNextProps {
  /** Custom className */
  className?: string;
}

export function BranchNext({ className }: BranchNextProps) {
  const { currentBranch, totalBranches, goToNext } = useBranch();
  const isDisabled = currentBranch >= totalBranches - 1;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={goToNext}
      disabled={isDisabled}
      className={cn("h-7 w-7 p-0", className)}
      aria-label="Next branch"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

// Branch Page Indicator
export interface BranchPageProps {
  /** Custom className */
  className?: string;
}

export function BranchPage({ className }: BranchPageProps) {
  const { currentBranch, totalBranches } = useBranch();

  if (totalBranches <= 1) {
    return null;
  }

  return (
    <span
      className={cn("text-xs text-muted-foreground px-2", className)}
      aria-label={`Branch ${currentBranch + 1} of ${totalBranches}`}
    >
      {currentBranch + 1} of {totalBranches}
    </span>
  );
}
