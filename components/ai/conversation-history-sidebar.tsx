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
import { MessageSquare, PanelLeftClose } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIConversation } from "@/lib/models/types";
import { ConversationHistoryItem } from "./conversation-history-item";
import { NewConversationButton } from "./new-conversation-button";

// Import CourseSummary type
import type { CourseSummary } from "@/lib/models/types";

// Course group interface
interface CourseGroup {
  courseId: string | null;
  courseName: string;
  conversations: AIConversation[];
}

/**
 * Group conversations by course
 * @param conversations - Array of conversations to group
 * @param availableCourses - Optional array of courses for name lookup
 */
function groupConversationsByCourse(
  conversations: AIConversation[],
  availableCourses?: CourseSummary[]
): CourseGroup[] {
  // Group conversations by courseId
  const courseMap = new Map<string | null, AIConversation[]>();

  conversations.forEach((conv) => {
    const key = conv.courseId;
    if (!courseMap.has(key)) {
      courseMap.set(key, []);
    }
    courseMap.get(key)!.push(conv);
  });

  // Convert to array and add course names
  const groups: CourseGroup[] = [];

  courseMap.forEach((convs, courseId) => {
    let courseName: string;

    if (courseId === null) {
      courseName = "General";
    } else {
      // Look up course name from availableCourses
      const course = availableCourses?.find(c => c.id === courseId);
      courseName = course ? `${course.code} - ${course.name}` : courseId;
    }

    groups.push({
      courseId,
      courseName,
      conversations: convs,
    });
  });

  // Sort groups: General last, others by course name
  return groups.sort((a, b) => {
    if (a.courseId === null) return 1; // General goes last
    if (b.courseId === null) return -1;
    return a.courseName.localeCompare(b.courseName);
  });
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
   * Callback to toggle sidebar (desktop collapse)
   * Triggered when user clicks collapse button on desktop
   */
  onToggle?: () => void;

  /**
   * Available courses for name lookup (optional)
   * Used to display course names in group headers
   */
  availableCourses?: CourseSummary[];

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
  onToggle,
  availableCourses,
  className,
}: ConversationHistorySidebarProps) {
  // Group conversations by course
  const groupedConversations = useMemo(() => {
    // Sort conversations by most recent first within each group
    const sorted = [...conversations].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return groupConversationsByCourse(sorted, availableCourses);
  }, [conversations, availableCourses]);

  // Handle conversation click (with mobile close)
  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId);
    if (onClose) onClose(); // Close drawer on mobile after selection
  };

  return (
    <nav
      className={cn(
        "flex h-full flex-col overflow-hidden bg-background",
        // Mobile: Absolute overlay with fixed width
        "absolute left-0 top-0 z-50 h-full md:relative md:z-0",
        // Width: 280px when open, 0px when closed (allows main content to expand)
        isOpen ? "w-[280px]" : "w-0",
        // Slide animation - hidden when closed on all screen sizes
        isOpen ? "translate-x-0" : "-translate-x-full",
        "transition-all duration-300 ease-in-out",
        // Border on desktop for separation (only when open)
        isOpen && "md:border-r md:border-glass",
        className
      )}
      aria-label="Conversation history"
      aria-hidden={!isOpen}
    >
      {/* Header with New Conversation Button and Collapse Toggle */}
      <div className="flex-shrink-0 p-4 border-b border-glass space-y-3">
        {/* Collapse Button (Desktop Only) */}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hidden md:flex h-8 w-full justify-center items-center"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}

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

        {/* Grouped Conversation Items (by Course) */}
        {!isLoading && groupedConversations.map(({ courseId, courseName, conversations: groupConvs }) => (
          <div key={courseId || 'general'} className="mb-6 last:mb-0">
            {/* Course Group Header */}
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground glass-text uppercase tracking-wide">
              {courseName}
            </h3>

            {/* Conversations in this course */}
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
