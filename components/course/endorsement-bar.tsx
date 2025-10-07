"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface EndorsementBarProps {
  total: number;
  byRole: {
    student: number;
    instructor: number;
    ta: number;
  };
  currentUserEndorsed: boolean;
  onEndorse?: () => void;
  disabled?: boolean;
  className?: string;
}

export function EndorsementBar({
  total,
  byRole,
  currentUserEndorsed,
  onEndorse,
  disabled = false,
  className,
}: EndorsementBarProps) {
  const hasInstructorEndorsement = byRole.instructor > 0;

  return (
    <div className={cn("flex items-center gap-4 flex-wrap", className)}>
      {/* Endorsement Count with Visual Breakdown */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-2"
              aria-live="polite"
            >
              <ThumbsUp className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {total} {total === 1 ? "endorsement" : "endorsements"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2 text-xs">
              <p className="font-semibold border-b border-border pb-1 mb-2">Endorsement Breakdown</p>

              {/* Instructor Endorsements (Gold) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Instructors</span>
                </div>
                <span className="font-semibold text-amber-600">{byRole.instructor} (3x weight)</span>
              </div>

              {/* TA Endorsements (Blue) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>TAs</span>
                </div>
                <span className="font-semibold text-blue-600">{byRole.ta}</span>
              </div>

              {/* Student Endorsements (Gray) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-neutral-400" />
                  <span>Students</span>
                </div>
                <span className="font-semibold text-neutral-600">{byRole.student}</span>
              </div>

              <div className="border-t border-border pt-2 mt-2 text-muted-foreground">
                <p className="text-xs italic">Weighted total: {total}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Instructor Endorsement Badge (Gold/Amber) */}
      {hasInstructorEndorsement && (
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400"
        >
          <Award className="size-3" aria-hidden="true" />
          Instructor Endorsed
        </Badge>
      )}

      {/* TA Endorsement Badge (Blue) - if we have TAs and no instructor */}
      {!hasInstructorEndorsement && byRole.ta > 0 && (
        <Badge
          variant="outline"
          className="gap-1.5 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400"
        >
          <Award className="size-3" aria-hidden="true" />
          TA Endorsed
        </Badge>
      )}

      {/* Endorse Button */}
      <Button
        variant={currentUserEndorsed ? "secondary" : "default"}
        size="sm"
        onClick={onEndorse}
        disabled={disabled || currentUserEndorsed}
        aria-pressed={currentUserEndorsed}
        className="ml-auto"
      >
        <ThumbsUp className="size-4 mr-2" aria-hidden="true" />
        {currentUserEndorsed ? "Endorsed" : "Endorse Answer"}
      </Button>
    </div>
  );
}
