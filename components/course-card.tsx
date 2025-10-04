import Link from "next/link";
import type { Course } from "@/lib/models/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/notification-badge";

export interface CourseCardProps {
  /**
   * Course data object
   */
  course: Course;

  /**
   * Number of unread notifications for this course
   * @default 0
   */
  unreadCount?: number;

  /**
   * Course metrics data
   */
  metrics?: {
    threadCount: number;
    activeStudents: number;
    recentActivity: number; // threads in last 7 days
  };

  /**
   * Instructor avatars to display
   * @default [] (fetched internally if not provided)
   */
  instructorAvatars?: Array<{
    name: string;
    avatar?: string;
  }>;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom link prefix (for testing or alternate navigation)
   * @default "/courses"
   */
  linkPrefix?: string;
}

export function CourseCard({
  course,
  unreadCount = 0,
  metrics,
  instructorAvatars = [],
  className,
  linkPrefix = "/courses",
}: CourseCardProps) {
  const isActive = course.status === "active";

  return (
    <Link
      href={`${linkPrefix}/${course.id}`}
      className="block group"
      aria-label={`${course.code}: ${course.name}${unreadCount > 0 ? `, ${unreadCount} unread notifications` : ""}`}
    >
      <Card
        variant="hover"
        className={cn(
          "transition-all duration-200",
          !isActive && "opacity-60",
          className
        )}
      >
        <CardHeader className="pb-4">
          {/* Header with notification badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {course.code}
                </CardTitle>
                {unreadCount > 0 && (
                  <NotificationBadge count={unreadCount} size="sm" />
                )}
              </div>
              <CardDescription className="line-clamp-1 text-base font-medium">
                {course.name}
              </CardDescription>
              <CardDescription className="text-xs text-muted-foreground">
                {course.term}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Metrics Bar */}
          {metrics && (
            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="text-sm">{metrics.threadCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-sm">{metrics.activeStudents}</span>
              </div>
              {metrics.recentActivity > 0 && (
                <div className="flex items-center gap-1.5 text-success">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-sm">{metrics.recentActivity} new</span>
                </div>
              )}
            </div>
          )}

          {/* Instructors and Status Badge */}
          <div className="flex items-center justify-between gap-4">
            {/* Instructor Avatars (max 3) */}
            {instructorAvatars.length > 0 && (
              <div className="flex -space-x-2">
                {instructorAvatars.slice(0, 3).map((instructor, i) => (
                  <Avatar
                    key={i}
                    className="h-6 w-6 ring-2 ring-background"
                  >
                    <AvatarImage
                      src={instructor.avatar}
                      alt={instructor.name}
                    />
                    <AvatarFallback className="text-xs">
                      {instructor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {instructorAvatars.length > 3 && (
                  <div className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">
                      +{instructorAvatars.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className="text-xs capitalize"
            >
              {course.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
