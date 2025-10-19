"use client";

/**
 * AI Metrics Dashboard
 *
 * Displays AI usage statistics and cost tracking information.
 * For demo purposes, shows message counts and usage patterns.
 *
 * In production, would show:
 * - Token usage by model
 * - Estimated costs
 * - Rate limit status
 * - Cache hit rates
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Eye, FileText, TrendingUp, RefreshCw } from "lucide-react";
import { getMetrics, resetMetrics, type AIMetrics } from "@/lib/store/metrics";
import { cn } from "@/lib/utils";

export interface MetricsDashboardProps {
  /** Custom className */
  className?: string;

  /** Show reset button (for demo/testing) */
  showReset?: boolean;
}

export function MetricsDashboard({ className, showReset = false }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMetrics = () => {
    setMetrics(getMetrics());
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMetrics();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleReset = () => {
    if (confirm("Reset all AI usage metrics? This cannot be undone.")) {
      resetMetrics();
      loadMetrics();
    }
  };

  if (!metrics) {
    return (
      <Card variant="glass" className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-sm glass-text">Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalInteractions = metrics.messagesSent + metrics.responsesGenerated;

  const stats = [
    {
      label: "Conversations",
      value: metrics.conversationsCreated,
      icon: MessageSquare,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Messages Sent",
      value: metrics.messagesSent,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "AI Responses",
      value: metrics.responsesGenerated,
      icon: Sparkles,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Previews Generated",
      value: metrics.previewsGenerated,
      icon: Eye,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Threads Created",
      value: metrics.threadsCreated,
      icon: FileText,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="heading-4 glass-text">AI Usage Metrics</h3>
          <p className="text-sm text-muted-foreground glass-text mt-1">
            Track your AI interactions and usage patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          {showReset && (
            <Button variant="outline" size="sm" onClick={handleReset} className="text-destructive">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="glass" className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground glass-text mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold glass-text">{stat.value.toLocaleString()}</p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card variant="glass-strong">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage Summary</CardTitle>
          <CardDescription className="text-xs">Overall activity statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground glass-text">Total Interactions</span>
            <span className="font-semibold glass-text">{totalInteractions.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground glass-text">First Usage</span>
            <span className="font-semibold glass-text text-xs">
              {new Date(metrics.firstUsage).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground glass-text">Last Usage</span>
            <span className="font-semibold glass-text text-xs">
              {new Date(metrics.lastUsage).toLocaleString()}
            </span>
          </div>

          {/* Placeholder for future features */}
          <div className="mt-4 pt-4 border-t border-[var(--border-glass)]">
            <p className="text-xs text-muted-foreground glass-text italic">
              💡 In production: token counts, cost estimates, and rate limit tracking would appear
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
