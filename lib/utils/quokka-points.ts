/**
 * Quokka Points calculation utilities
 * Educational gamification system rewarding Q&A participation
 */

import type { Thread, Post, PointSource, PointMilestone, QuokkaPointsData } from "@/lib/models/types";
import { ThumbsUp, MessageSquare, Star, Share2, HelpCircle } from "lucide-react";
import { generateSparkline } from "./dashboard-calculations";

// ============================================
// Constants
// ============================================

/**
 * Point values for different actions
 * Matches component design specifications
 */
export const POINT_VALUES = {
  HELPFUL_ANSWER: 10,          // Answer marked helpful (endorsed by peer)
  PEER_ENDORSEMENT: 5,         // Peer endorses your answer
  INSTRUCTOR_ENDORSEMENT: 20,  // Instructor endorses your answer
  SHARE_CONVERSATION: 15,      // Share AI conversation as thread
  QUESTION_ASKED: 2,           // Ask a question (small incentive)
} as const;

/**
 * Milestone thresholds and labels
 */
export const MILESTONES = [
  { threshold: 100, label: "Getting Started" },
  { threshold: 250, label: "Active Learner" },
  { threshold: 500, label: "Active Contributor" },
  { threshold: 1000, label: "Helpful Contributor" },
  { threshold: 2500, label: "Community Expert" },
] as const;

// ============================================
// Point Calculation
// ============================================

/**
 * Calculate total Quokka Points for a user
 *
 * @param userId - User ID to calculate points for
 * @param userThreads - All threads created by user
 * @param userPosts - All posts created by user
 * @returns QuokkaPointsData with complete breakdown
 */
export function calculateQuokkaPoints(
  userId: string,
  userThreads: Thread[],
  userPosts: Post[]
): QuokkaPointsData {
  // 1. Calculate point sources
  const pointSources: PointSource[] = [];

  // Source 1: Peer Endorsements (endorsed posts, not by instructor)
  const peerEndorsedPosts = userPosts.filter(p =>
    p.endorsed &&
    p.endorsedBy &&
    p.endorsedBy.length > 0 &&
    !p.instructorEndorsed  // Exclude instructor endorsements
  );
  const peerEndorsementCount = peerEndorsedPosts.reduce((sum, post) => {
    // Count peer endorsers only (filter out instructor IDs)
    const peerEndorsers = (post.endorsedBy || []).filter(id => !id.startsWith('instructor-'));
    return sum + peerEndorsers.length;
  }, 0);
  const peerEndorsementPoints = peerEndorsementCount * POINT_VALUES.PEER_ENDORSEMENT;

  if (peerEndorsementCount > 0) {
    pointSources.push({
      id: "peer-endorsements",
      label: "Peer Endorsements",
      icon: ThumbsUp,
      points: peerEndorsementPoints,
      count: peerEndorsementCount,
      pointsPerAction: POINT_VALUES.PEER_ENDORSEMENT,
    });
  }

  // Source 2: Helpful Answers (posts with peer endorsements)
  const helpfulAnswers = peerEndorsedPosts.length;
  const helpfulAnswerPoints = helpfulAnswers * POINT_VALUES.HELPFUL_ANSWER;

  if (helpfulAnswers > 0) {
    pointSources.push({
      id: "helpful-answers",
      label: "Helpful Answers",
      icon: MessageSquare,
      points: helpfulAnswerPoints,
      count: helpfulAnswers,
      pointsPerAction: POINT_VALUES.HELPFUL_ANSWER,
    });
  }

  // Source 3: Instructor Endorsements (highest value)
  const instructorEndorsedPosts = userPosts.filter(p =>
    p.endorsed && p.instructorEndorsed
  );
  const instructorEndorsementCount = instructorEndorsedPosts.length;
  const instructorEndorsementPoints = instructorEndorsementCount * POINT_VALUES.INSTRUCTOR_ENDORSEMENT;

  if (instructorEndorsementCount > 0) {
    pointSources.push({
      id: "instructor-endorsements",
      label: "Instructor Endorsed",
      icon: Star,
      points: instructorEndorsementPoints,
      count: instructorEndorsementCount,
      pointsPerAction: POINT_VALUES.INSTRUCTOR_ENDORSEMENT,
    });
  }

  // Source 4: Shared Conversations (threads converted from AI chat)
  // Identify by checking thread metadata (future: add `sharedFromChat` flag to Thread)
  // For now, approximate: threads with AI answers and high engagement
  const sharedConversations = userThreads.filter(t =>
    t.hasAIAnswer && t.views > 5
  ).length;
  const sharePoints = sharedConversations * POINT_VALUES.SHARE_CONVERSATION;

  if (sharedConversations > 0) {
    pointSources.push({
      id: "shared-conversations",
      label: "Shared Conversations",
      icon: Share2,
      points: sharePoints,
      count: sharedConversations,
      pointsPerAction: POINT_VALUES.SHARE_CONVERSATION,
    });
  }

  // Source 5: Questions Asked (small incentive)
  const questionsAsked = userThreads.length;
  const questionPoints = questionsAsked * POINT_VALUES.QUESTION_ASKED;

  if (questionsAsked > 0) {
    pointSources.push({
      id: "questions-asked",
      label: "Questions Asked",
      icon: HelpCircle,
      points: questionPoints,
      count: questionsAsked,
      pointsPerAction: POINT_VALUES.QUESTION_ASKED,
    });
  }

  // 2. Calculate total points
  const totalPoints = pointSources.reduce((sum, source) => sum + source.points, 0);

  // 3. Calculate weekly points (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = userPosts.filter(p =>
    new Date(p.createdAt) >= sevenDaysAgo
  );
  const recentThreads = userThreads.filter(t =>
    new Date(t.createdAt) >= sevenDaysAgo
  );

  // Recalculate points for recent activity only
  const weeklyPeerEndorsements = recentPosts.filter(p =>
    p.endorsed && !p.instructorEndorsed
  ).length * POINT_VALUES.PEER_ENDORSEMENT;

  const weeklyHelpfulAnswers = recentPosts.filter(p =>
    p.endorsed && !p.instructorEndorsed
  ).length * POINT_VALUES.HELPFUL_ANSWER;

  const weeklyInstructorEndorsements = recentPosts.filter(p =>
    p.endorsed && p.instructorEndorsed
  ).length * POINT_VALUES.INSTRUCTOR_ENDORSEMENT;

  const weeklyShares = recentThreads.filter(t =>
    t.hasAIAnswer && t.views > 5
  ).length * POINT_VALUES.SHARE_CONVERSATION;

  const weeklyQuestions = recentThreads.length * POINT_VALUES.QUESTION_ASKED;

  const weeklyPoints = weeklyPeerEndorsements + weeklyHelpfulAnswers +
    weeklyInstructorEndorsements + weeklyShares + weeklyQuestions;

  // 4. Calculate milestones
  const milestones: PointMilestone[] = MILESTONES.map(m => ({
    threshold: m.threshold,
    label: m.label,
    achieved: totalPoints >= m.threshold,
  }));

  // 5. Generate sparkline (7-day history)
  const avgPointsPerDay = totalPoints / Math.max(1, userThreads.length + userPosts.length / 2);
  const sparklineData = generateSparkline(
    `quokka-points-${userId}`,
    7,
    Math.max(1, avgPointsPerDay)
  );

  // 6. Sort point sources by points (highest first)
  pointSources.sort((a, b) => b.points - a.points);

  return {
    totalPoints,
    weeklyPoints,
    pointSources,
    milestones,
    sparklineData,
  };
}
