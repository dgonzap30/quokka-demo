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
      {/* Endorsement Count */}
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
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p>
                <strong>{byRole.student}</strong> from students
              </p>
              <p>
                <strong>{byRole.instructor}</strong> from instructors (3x weight)
              </p>
              <p>
                <strong>{byRole.ta}</strong> from TAs
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Instructor Badge */}
      {hasInstructorEndorsement && (
        <Badge variant="outline" className="gap-1.5">
          <Award className="size-3" aria-hidden="true" />
          Instructor Endorsed
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
