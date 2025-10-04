"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingAskButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingAskButton({ onClick, className }: FloatingAskButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-e3 hover:shadow-e3 hover:scale-110 transition-all duration-200 z-40",
        "md:h-16 md:w-16",
        className
      )}
    >
      <MessageSquarePlus className="h-6 w-6" />
      <span className="sr-only">Ask a Question</span>
    </Button>
  );
}
