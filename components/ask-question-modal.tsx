"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAskQuestion,
  useSimilarThreads,
  useCreateThread,
  useCurrentUser,
} from "@/lib/api/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { AiAnswerCard } from "@/components/ai-answer-card";
import Link from "next/link";
import type { AiAnswer } from "@/lib/models/types";

interface AskQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskQuestionModal({ open, onOpenChange }: AskQuestionModalProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AiAnswer | null>(null);

  const askQuestion = useAskQuestion();
  const createThread = useCreateThread();
  const { data: similarThreads } = useSimilarThreads(debouncedTitle, debouncedTitle.length > 3);

  // Debounce title for similar thread search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(title);
    }, 500);
    return () => clearTimeout(timer);
  }, [title]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setAiAnswer(null);
      setDebouncedTitle("");
    }
  }, [open]);

  const handleGetAiAnswer = async () => {
    if (!title.trim()) return;

    const result = await askQuestion.mutateAsync({
      question: title,
    });
    setAiAnswer(result);
  };

  const handlePostThread = async () => {
    if (!title.trim() || !content.trim() || !currentUser) return;

    const thread = await createThread.mutateAsync({
      title,
      content,
      authorId: currentUser.id,
    });

    onOpenChange(false);
    router.push(`/threads/${thread.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2.5">
            <span>Ask a Question</span>
            <Sparkles className="h-6 w-6 text-ai-purple-500" />
          </DialogTitle>
          <DialogDescription>
            Get instant AI-powered answers from course materials, or post to the community for peer support
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr,300px] gap-6 mt-4">
          {/* Main Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Title</label>
                  <Input
                    placeholder="e.g., How do I implement binary search in Python?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Details</label>
                  <Textarea
                    placeholder="Provide more context about your question..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="text-base"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ai"
                    size="lg"
                    onClick={handleGetAiAnswer}
                    disabled={!title.trim() || askQuestion.isPending}
                    className="flex-1"
                  >
                    {askQuestion.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        AI is thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Get AI Answer
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    onClick={handlePostThread}
                    disabled={!title.trim() || !content.trim() || createThread.isPending}
                    className="flex-1"
                  >
                    {createThread.isPending ? "Posting..." : "Post to Forum"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Answer */}
            {aiAnswer && (
              <div>
                <AiAnswerCard answer={aiAnswer} />
                <p className="text-sm text-muted-foreground mt-4">
                  If this doesn&apos;t answer your question, post it to the forum for community help.
                </p>
              </div>
            )}
          </div>

          {/* Similar Questions Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ai-purple-500" />
                  Similar Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {similarThreads && similarThreads.length > 0 ? (
                  <div className="space-y-3">
                    {similarThreads.map((similar) => (
                      <Link
                        key={similar.id}
                        href={`/threads/${similar.id}`}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border border-ai-purple-200/50 dark:border-ai-purple-800/30 hover:bg-ai-purple-50 dark:hover:bg-ai-purple-950/20 transition-all hover:shadow-ai-sm group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-ai-purple-600 dark:group-hover:text-ai-purple-400">
                            {similar.title}
                          </p>
                          <ExternalLink className="h-4 w-4 flex-shrink-0 text-ai-purple-400" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-semibold text-ai-purple-600 dark:text-ai-purple-400">
                            {Math.round(similar.similarity * 100)}% match
                          </div>
                          {similar.hasAnswer && (
                            <div className="text-xs font-medium text-success flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-success" />
                              Has answer
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : debouncedTitle.length > 3 ? (
                  <div className="text-center py-6">
                    <div className="text-sm text-muted-foreground">
                      No similar questions found
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Your question might be unique!
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Sparkles className="h-10 w-10 text-ai-purple-300 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Type your question to see similar threads
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-surface via-surface to-surface-2">
              <CardHeader>
                <CardTitle className="text-sm">💡 Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex gap-2">
                  <div className="text-primary font-bold">1.</div>
                  <div>Be specific in your question title</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-primary font-bold">2.</div>
                  <div>Include code snippets if relevant</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-primary font-bold">3.</div>
                  <div>Check similar questions first</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-ai-purple-500 font-bold">✨</div>
                  <div className="font-medium text-foreground">Try the AI answer for instant help</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
