"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser, useStudentDashboard } from "@/lib/api/hooks";
import { QuokkaPointsHero } from "@/components/points/quokka-points-hero";
import { MilestonesTimeline } from "@/components/points/milestones-timeline";
import { PointSourcesBreakdown } from "@/components/points/point-sources-breakdown";
import { PointsActivityFeed } from "@/components/points/points-activity-feed";
import { BackButton } from "@/components/navigation/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuokkaIcon } from "@/components/ui/quokka-icon";

/**
 * Quokka Points Page
 *
 * Comprehensive view of user's Quokka Points, including:
 * - Hero section with total points and animated icon
 * - Milestones timeline showing achievement progress
 * - Points breakdown by source (detailed table/cards)
 * - Activity feed showing recent point-earning actions
 *
 * Route: /points
 * Auth: Required (redirects to /login if not authenticated)
 * Data: Uses existing QuokkaPointsData from useStudentDashboard
 */
export default function PointsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: dashboard, isLoading: dashLoading } = useStudentDashboard(user?.id);

  const pointsData = dashboard?.quokkaPoints;
  const isLoading = userLoading || dashLoading;

  // Auth guard: redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Not authenticated (redirect in progress)
  if (!user) {
    return null;
  }

  // Empty state (no points data or zero points)
  if (!pointsData || pointsData.totalPoints === 0) {
    return <EmptyState />;
  }

  // Derive next milestone
  const nextMilestone = pointsData.milestones.find((m) => !m.achieved) || null;

  // Main content
  return (
    <div className="min-h-screen">
      <div className="container-wide space-y-8 p-4 md:p-6">
        {/* Back Navigation */}
        <BackButton />

        {/* Hero Section */}
        <QuokkaPointsHero
          totalPoints={pointsData.totalPoints}
          weeklyPoints={pointsData.weeklyPoints}
          nextMilestone={nextMilestone}
          userName={user.name}
        />

        {/* Milestones Timeline */}
        <section aria-labelledby="milestones-heading">
          <h2 id="milestones-heading" className="text-2xl md:text-3xl font-bold glass-text mb-6">
            Your Milestones
          </h2>
          <MilestonesTimeline milestones={pointsData.milestones} />
        </section>

        {/* Points Breakdown */}
        <section aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-2xl md:text-3xl font-bold glass-text mb-6">
            Points Breakdown
          </h2>
          <PointSourcesBreakdown pointSources={pointsData.pointSources} />
        </section>

        {/* Activity Feed (Optional) */}
        {pointsData.sparklineData && (
          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="text-2xl md:text-3xl font-bold glass-text mb-6">
              Recent Activity
            </h2>
            <PointsActivityFeed
              sparklineData={pointsData.sparklineData}
              userId={user.id}
            />
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Loading state component
 * Displays skeleton loaders while data is fetching
 */
function LoadingState() {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="container-wide space-y-8">
        <Skeleton className="h-32 w-full bg-glass-medium rounded-xl" />
        <Skeleton className="h-64 w-full bg-glass-medium rounded-xl" />
        <Skeleton className="h-96 w-full bg-glass-medium rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 * Shown when user has zero Quokka Points
 */
function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="glass" className="max-w-md p-8 text-center space-y-6">
        <div className="flex justify-center">
          <QuokkaIcon size="xl" variant="outline" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Start Your Quokka Journey!</h1>
          <p className="text-muted-foreground glass-text">
            You haven&apos;t earned any Quokka Points yet. Ask questions, help peers,
            and get endorsed to start earning!
          </p>
        </div>
        <Button variant="default" size="lg" asChild>
          <Link href="/ask">Ask Your First Question</Link>
        </Button>
      </Card>
    </div>
  );
}
