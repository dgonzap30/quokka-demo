import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Sparkles, Eye, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Thread } from "@/lib/models/types";
import { formatDistanceToNow } from "@/lib/utils/date";

interface ThreadCardProps {
  thread: Thread;
  linkPrefix?: string;
}

export function ThreadCard({ thread, linkPrefix = "/threads" }: ThreadCardProps) {
  const statusConfig = {
    open: { label: "Open", variant: "outline" as const },
    answered: { label: "Answered", variant: "secondary" as const },
    resolved: { label: "Resolved", variant: "default" as const },
    canonical: { label: "Canonical", variant: "default" as const },
  };

  const status = statusConfig[thread.status];
  const hasAiAnswer = !!thread.aiAnswer;

  return (
    <Link href={`${linkPrefix}/${thread.id}`} className="block group">
      <Card
        variant="hover"
        className={cn(
          "transition-all duration-250 hover:shadow-e2",
          hasAiAnswer && "ring-1 ring-ai-purple-200/50"
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2.5">
              <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {thread.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                {thread.content}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 ring-1 ring-border">
                  <AvatarImage src={thread.author.avatar} alt={thread.author.name} />
                  <AvatarFallback className="text-xs">{thread.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground/80">{thread.author.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-sm">{thread.posts.length}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                <span className="text-sm">{thread.views}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(thread.updatedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
            {thread.endorsed && (
              <Badge variant="default" className="gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500">
                <Award className="h-3 w-3" />
                Endorsed
              </Badge>
            )}
            {hasAiAnswer && (
              <Badge variant="ai" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                AI Answer
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
