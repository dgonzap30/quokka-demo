"use client";

import Link from "next/link";
import { AuthGuard } from "@/lib/auth-guard";
import { NavHeader } from "@/components/nav-header";
import { useInstructorMetrics, useUnansweredThreads } from "@/lib/api/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadCard } from "@/components/thread-card";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Award,
  Flag,
  Users,
  ArrowRight,
} from "lucide-react";

function InstructorDashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useInstructorMetrics();
  const { data: unanswered, isLoading: unansweredLoading } = useUnansweredThreads();

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor course activity, track engagement, and manage student questions
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {metricsLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </>
          ) : metrics ? (
            <>
              <Card className="border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Unanswered Questions
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-0.5">{metrics.unansweredCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting response
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-success shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Answered Today
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-0.5">{metrics.answeredToday}</div>
                  <p className="text-xs text-muted-foreground">
                    Questions resolved
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-info shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Avg Response Time
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-info" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-0.5">{metrics.averageResponseTime}</div>
                  <p className="text-xs text-muted-foreground">
                    Average turnaround
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Endorsed Answers
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-0.5">{metrics.endorsedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Quality responses
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-danger shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Flagged Posts
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-danger/10 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-danger" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-0.5">{metrics.flaggedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Needs attention
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Active Students
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-secondary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-0.5">{metrics.activeStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Participating
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Unanswered Questions */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Unanswered Questions</h2>
            <Link href="/instructor/threads">
              <Button variant="outline" size="sm" className="gap-2">
                View All Threads
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {unansweredLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          ) : unanswered && unanswered.length > 0 ? (
            <div className="space-y-4">
              {unanswered.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} linkPrefix="/instructor/threads" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-3">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                All caught up!
              </p>
              <p className="text-sm text-muted-foreground">
                No unanswered questions at the moment
              </p>
              <Link href="/instructor/threads" className="mt-4 inline-block">
                <Button variant="outline" className="gap-2">
                  Browse All Threads
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard requiredRole={["instructor", "ta"]}>
      <InstructorDashboardPage />
    </AuthGuard>
  );
}
