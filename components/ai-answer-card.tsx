"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiAnswer } from "@/lib/models/types";

interface AiAnswerCardProps {
  answer: AiAnswer;
}

export function AiAnswerCard({ answer }: AiAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  const confidenceConfig = {
    high: {
      variant: "ai-shimmer" as const,
      label: "High Confidence",
      dotColor: "bg-ai-cyan-400"
    },
    medium: {
      variant: "ai-outline" as const,
      label: "Medium Confidence",
      dotColor: "bg-ai-purple-400"
    },
    low: {
      variant: "outline" as const,
      label: "Low Confidence",
      dotColor: "bg-warning"
    },
  };

  const config = confidenceConfig[answer.confidenceLevel];

  return (
    <Card
      variant="ai"
      className="overflow-hidden border-ai-purple-200/50"
    >
      <div className="bg-gradient-to-br from-ai-purple-50/30 to-ai-indigo-50/20 dark:from-ai-purple-950/10 dark:to-ai-indigo-950/5 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-ai-purple-500" />
            <div>
              <h3 className="text-base font-semibold text-foreground">
                AI-Generated Answer
              </h3>
              <p className="text-xs text-muted-foreground">
                Powered by course materials
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className="gap-1 text-xs">
              <div className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
              {config.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse answer" : "Expand answer"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-5 mt-5 pt-5 border-t border-border/50">
            {/* Answer Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {answer.text}
              </div>
            </div>

            {/* Citations */}
            {answer.citations && answer.citations.length > 0 && (
              <div className="space-y-2.5 p-4 rounded-md bg-background/60 border border-border/60">
                <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80">
                  <ExternalLink className="h-3.5 w-3.5 text-ai-purple-500" />
                  Sources & Citations
                </h4>
                <ul className="space-y-2">
                  {answer.citations.map((citation, idx) => (
                    <li key={idx}>
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors group"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-ai-purple-500" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ai-purple-600 dark:text-ai-purple-400 group-hover:underline text-xs">
                            {citation.title || citation.url}
                          </div>
                          {citation.snippet && (
                            <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                              {citation.snippet}
                            </div>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feedback & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-ai-purple-500" />
                Always verify important information
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Was this helpful?</span>
                <Button
                  variant={helpful === true ? "ai-outline" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setHelpful(true)}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant={helpful === false ? "outline" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setHelpful(false)}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
