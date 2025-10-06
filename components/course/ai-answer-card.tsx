"use client";

import type { AIAnswer } from "@/lib/models/types";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { AIBadge } from "@/components/ui/ai-badge";
import { ConfidenceMeter } from "./confidence-meter";
import { CitationList } from "./citation-list";
import { EndorsementBar } from "./endorsement-bar";
import { cn } from "@/lib/utils";

export interface AIAnswerCardProps {
  answer: AIAnswer;
  currentUserEndorsed: boolean;
  currentUserRole?: "student" | "instructor" | "ta";
  onEndorse?: () => void;
  onCitationClick?: (citation: any) => void;
  variant?: "hero" | "compact";
  isEndorsing?: boolean;
  className?: string;
}

export function AIAnswerCard({
  answer,
  currentUserEndorsed,
  currentUserRole,
  onEndorse,
  onCitationClick,
  variant = "hero",
  isEndorsing = false,
  className,
}: AIAnswerCardProps) {
  const cardVariant = variant === "hero" ? "ai-hero" : "ai";

  return (
    <Card
      variant={cardVariant}
      className={cn("ai-card", className)}
      role="article"
      aria-label="AI-generated answer"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* AI Badge + Confidence Meter */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <AIBadge variant={variant === "hero" ? "large" : "default"} />
            <ConfidenceMeter
              level={answer.confidenceLevel}
              score={answer.confidenceScore}
              size={variant === "hero" ? "lg" : "md"}
              className="flex-1"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Answer Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {answer.content}
          </div>
        </div>

        {/* Citations */}
        {answer.citations.length > 0 && (
          <CitationList
            citations={answer.citations}
            onCitationClick={onCitationClick}
            maxVisible={3}
          />
        )}
      </CardContent>

      {/* Endorsement Bar */}
      {onEndorse && (
        <CardFooter className="border-t pt-6">
          <EndorsementBar
            total={answer.totalEndorsements}
            byRole={{
              student: answer.studentEndorsements,
              instructor: answer.instructorEndorsements,
              ta: 0, // Not tracked separately in current schema
            }}
            currentUserEndorsed={currentUserEndorsed}
            onEndorse={onEndorse}
            disabled={isEndorsing}
            className="w-full"
          />
        </CardFooter>
      )}
    </Card>
  );
}
