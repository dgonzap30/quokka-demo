"use client";

/**
 * ConversationHistorySidebar - ChatGPT/Claude-inspired sidebar for conversation history
 *
 * Features:
 * - Timestamp-based grouping (Today, Yesterday, Previous 7 Days, etc.)
 * - Always-visible conversation list
 * - "New Conversation" button
 * - Empty state with icon and message
 * - Loading skeletons
 * - Mobile drawer support
 * - QDS glassmorphism styling
 * - Keyboard navigation
 * - WCAG 2.2 AA accessibility
 */

import { useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AIConversation } from "@/lib/models/types";
import { ConversationHistoryItem } from "./conversation-history-item";
import { NewConversationButton } from "./new-conversation-button";

// Timestamp group labels
type TimeGroup = "Today" | "Yesterday" | "Previous 7 Days" | "Previous 30 Days" | "Older";

interface GroupedConversations {
  group: TimeGroup;
  conversations: AIConversation[];
}

/**
 * Group conversations by timestamp relative to now
 */
function groupConversationsByTime(conversations: AIConversation[]): GroupedConversations[] {
  const now = new Date();
  const groups: Record<TimeGroup, AIConversation[]> = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    "Older": [],
  };

  conversations.forEach((conv) => {
    const updatedAt = new Date(conv.updatedAt);
    const diffInHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      groups["Today"].push(conv);
    } else if (diffInHours < 48) {
      groups["Yesterday"].push(conv);
    } else if (diffInHours < 24 * 7) {
      groups["Previous 7 Days"].push(conv);
    } else if (diffInHours < 24 * 30) {
      groups["Previous 30 Days"].push(conv);
    } else {
      groups["Older"].push(conv);
    }
  });

  // Return only non-empty groups in order
  const groupOrder: TimeGroup[] = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"];
  return groupOrder
    .filter(group => groups[group].length > 0)
    .map(group => ({ group, conversations: groups[group] }));
}

export interface ConversationHistorySidebarProps {
  /**
   * Array of all user's conversations
   * Should be pre-filtered to exclude converted threads
   */
  conversations: AIConversation[];

  /**
   * Currently active conversation ID
   */
  activeConversationId: string | null;

  /**
   * Handler for conversation selection
   * Called when user clicks a conversation item
   */
  onConversationSelect: (conversationId: string) => void;

  /**
   * Handler for creating new conversation
   * Called when user clicks "New Conversation" button
   */
  onNewConversation: () => void;

  /**
   * Handler for deleting a conversation
   * Called when user clicks delete button on conversation item
   */
  onDeleteConversation?: (conversationId: string) => void;

  /**
   * Loading state for conversations list
   */
  isLoading?: boolean;

  /**
   * Whether sidebar is collapsed (mobile drawer state)
   * Passed from parent for mobile responsiveness
   */
  isOpen?: boolean;

  /**
   * Callback to close sidebar (mobile only)
   * Triggered after conversation selection on mobile
   */
  onClose?: () => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function ConversationHistorySidebar({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
  isOpen = true,
  onClose,
  className,
}: ConversationHistorySidebarProps) {
  // Group conversations by timestamp (Today, Yesterday, etc.)
  const groupedConversations = useMemo(() => {
    // Sort conversations by most recent first
    const sorted = [...conversations].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return groupConversationsByTime(sorted);
  }, [conversations]);

  // Handle conversation click (with mobile close)
  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId);
    if (onClose) onClose(); // Close drawer on mobile after selection
  };

  return (
    <nav
      className={cn(
        "flex h-full flex-col overflow-hidden",
        // Mobile: Fixed drawer overlay
        "fixed left-0 top-0 z-50 w-[280px] h-screen md:relative md:z-0 md:w-full md:h-full",
        // Transform for mobile drawer
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "transition-transform duration-300 ease-in-out",
        className
      )}
      aria-label="Conversation history"
    >
      {/* Header with New Conversation Button */}
      <div className="flex-shrink-0 p-4 border-b border-glass">
        <NewConversationButton onClick={onNewConversation} />
      </div>

      {/* Conversation List - Always visible, fills remaining space */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-2 py-3 scroll-smooth"
        role="list"
        aria-label="Conversation history"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-3 py-2 rounded-lg glass-panel">
                <Skeleton className="h-4 w-full bg-glass-medium" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="heading-5 glass-text mb-2">No conversations yet</h3>
            <p className="text-sm text-muted-foreground glass-text max-w-[200px] leading-relaxed">
              Click &quot;New Conversation&quot; to start chatting with Quokka
            </p>
          </div>
        )}

        {/* Grouped Conversation Items */}
        {!isLoading && groupedConversations.map(({ group, conversations: groupConvs }) => (
          <div key={group} className="mb-6 last:mb-0">
            {/* Group Header */}
            <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground glass-text uppercase tracking-wide">
              {group}
            </h3>

            {/* Conversations in this group */}
            <div className="space-y-1">
              {groupConvs.map((conversation) => (
                <div key={conversation.id} role="listitem">
                  <ConversationHistoryItem
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    onDelete={onDeleteConversation}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
