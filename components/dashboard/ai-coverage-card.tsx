import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "@/components/ui/ai-badge";
import { Sparkles } from "lucide-react";

/**
 * AI Coverage Card Component
 *
 * Displays AI answer coverage statistics for instructor dashboards.
 * Shows percentage of threads with AI-generated answers and a visual progress bar.
 *
 * @example
 * <AICoverageCard
 *   percentage={75}
 *   totalThreads={100}
 *   aiThreads={75}
 * />
 */

export interface AICoverageCardProps {
  /** Percentage of threads with AI answers (0-100) */
  percentage: number;

  /** Total number of threads in the course */
  totalThreads: number;

  /** Number of threads with AI answers */
  aiThreads: number;
}

export function AICoverageCard({ percentage, totalThreads, aiThreads }: AICoverageCardProps) {
  return (
    <Card variant="glass">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="heading-5 glass-text flex items-center gap-2">
            <Sparkles className="h-5 w-5 ai-gradient-text" aria-hidden="true" />
            AI Coverage
          </CardTitle>
          <AIBadge variant="compact" />
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          <div className="text-5xl font-bold ai-gradient-text" aria-label={`${percentage} percent AI coverage`}>
            {percentage}%
          </div>
          <p className="text-sm text-muted-foreground glass-text">
            {aiThreads} of {totalThreads} threads answered by AI
          </p>
          <div className="h-2 rounded-full bg-glass-medium overflow-hidden" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full ai-gradient transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
