"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Award, Flag, CheckCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/models/types";
import { formatDate } from "@/lib/utils/date";
import { useEndorsePost, useFlagPost, useCurrentUser, useDeletePost, useUndoDeletePost } from "@/lib/api/hooks";
import { getSession } from "@/lib/session";
import { canDeletePost } from "@/lib/store/localStore";
import { toast } from "sonner";

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  const { data: currentUser } = useCurrentUser();
  const endorseMutation = useEndorsePost();
  const flagMutation = useFlagPost();
  const deleteMutation = useDeletePost();
  const undoDeleteMutation = useUndoDeletePost();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canModerate = currentUser?.role === "instructor" || currentUser?.role === "ta";
  const session = getSession();
  const canDelete = session && canDeletePost(session, post);

  const handleEndorse = () => {
    endorseMutation.mutate(post.id);
  };

  const handleFlag = () => {
    flagMutation.mutate(post.id);
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);

    try {
      await deleteMutation.mutateAsync(post.id);

      // Show success toast with undo option
      toast.success("Post deleted", {
        description: "The post has been removed from the thread.",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const restored = await undoDeleteMutation.mutateAsync(post.id);
              if (restored) {
                toast.success("Post restored");
              } else {
                toast.error("Could not restore post - undo period expired");
              }
            } catch {
              toast.error("Failed to restore post");
            }
          },
        },
        duration: 10000, // 10 seconds to match UNDO_TIMEOUT
      });
    } catch {
      toast.error("Failed to delete post");
    }
  };

  if (!post.author) {
    return null; // Skip rendering if author is null (anonymous post handling)
  }

  return (
    <>
      <div
        className={cn(
          "flex gap-5 p-6 rounded-xl border bg-card transition-all",
          post.endorsed &&
            "border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/30 to-transparent dark:from-amber-950/20",
          post.flagged &&
            "border-l-4 border-l-danger bg-gradient-to-r from-danger/5 to-transparent"
        )}
      >
        <Avatar className="h-12 w-12 ring-2 ring-background">
          <AvatarImage src={post.author.avatar} alt={post.author.name} />
          <AvatarFallback className="text-sm font-semibold">
            {post.author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-base">{post.author.name}</span>
                <Badge variant="outline" className="capitalize">
                  {post.author.role}
                </Badge>
                {post.isAnswer && (
                  <Badge variant="secondary" className="gap-1.5">
                    <CheckCircle className="h-3 w-3" />
                    Answer
                  </Badge>
                )}
                {post.endorsed && (
                  <Badge className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500">
                    <Award className="h-3 w-3" />
                    Endorsed
                  </Badge>
                )}
                {post.flagged && (
                  <Badge variant="destructive" className="gap-1.5">
                    <Flag className="h-3 w-3" />
                    Flagged
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {formatDate(post.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {canModerate && (
                <>
                  <Button
                    variant={post.endorsed ? "default" : "outline"}
                    size="sm"
                    onClick={handleEndorse}
                    disabled={endorseMutation.isPending}
                    className={cn(
                      post.endorsed &&
                        "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    )}
                    aria-label="Endorse post"
                  >
                    <Award className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={post.flagged ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleFlag}
                    disabled={flagMutation.isPending}
                    aria-label="Flag post"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteMutation.isPending}
                  className="text-danger hover:text-danger hover:bg-danger/10"
                  aria-label="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {post.content}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action can be undone within 10 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
