/**
 * Dashboard calculation utilities
 * Pure functions for trend analysis, goal tracking, and sparkline generation
 */

import type { GoalProgress, StatWithTrend } from '@/lib/models/types';

// ============================================
// Trend Calculation
// ============================================

export interface TrendResult {
  delta: number;
  percent: number;
  direction: 'up' | 'down' | 'neutral';
}

/**
 * Calculate trend between current and previous period
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Trend analysis with delta, percentage, direction
 *
 * @example
 * calculateTrend(15, 10) // { delta: 5, percent: 50, direction: 'up' }
 * calculateTrend(8, 10)  // { delta: -2, percent: -20, direction: 'down' }
 * calculateTrend(10, 10) // { delta: 0, percent: 0, direction: 'neutral' }
 */
export function calculateTrend(current: number, previous: number): TrendResult {
  const delta = current - previous;

  // Avoid division by zero
  const percent = previous === 0
    ? (current > 0 ? 100 : 0)
    : (delta / previous) * 100;

  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';

  return {
    delta: Math.round(delta),
    percent: Math.round(percent * 10) / 10, // 1 decimal place
    direction,
  };
}

/**
 * Create a StatWithTrend object from current and previous values
 */
export function createStatWithTrend(
  value: number,
  previousValue: number,
  label: string,
  sparkline?: number[]
): StatWithTrend {
  const trend = calculateTrend(value, previousValue);

  return {
    value,
    delta: trend.delta,
    trend: trend.direction,
    trendPercent: trend.percent,
    label,
    sparkline,
  };
}

// ============================================
// Goal Progress Calculation
// ============================================

export interface GoalProgressResult {
  progress: number;
  achieved: boolean;
}

/**
 * Calculate goal progress percentage
 *
 * @param current - Current progress
 * @param target - Target goal
 * @returns Progress percentage and achievement status
 *
 * @example
 * calculateGoalProgress(7, 10) // { progress: 70, achieved: false }
 * calculateGoalProgress(12, 10) // { progress: 120, achieved: true }
 * calculateGoalProgress(0, 5) // { progress: 0, achieved: false }
 */
export function calculateGoalProgress(current: number, target: number): GoalProgressResult {
  if (target <= 0) {
    return { progress: 0, achieved: false };
  }

  const progress = Math.round((current / target) * 100);
  const achieved = current >= target;

  return { progress, achieved };
}

/**
 * Create a GoalProgress object
 */
export function createGoal(
  id: string,
  title: string,
  description: string,
  current: number,
  target: number,
  period: 'daily' | 'weekly' | 'monthly',
  category: 'participation' | 'quality' | 'engagement' | 'response-time'
): GoalProgress {
  const { progress, achieved } = calculateGoalProgress(current, target);

  return {
    id,
    title,
    description,
    current,
    target,
    progress,
    achieved,
    period,
    category,
  };
}

// ============================================
// Sparkline Generation
// ============================================

/**
 * Generate deterministic sparkline data based on seed
 *
 * @param seed - String seed for deterministic generation
 * @param days - Number of days to generate (default: 7)
 * @param baseValue - Starting base value (default: 10)
 * @returns Array of daily values
 *
 * @example
 * generateSparkline("course-1-threads", 7, 10)
 * // [8, 9, 11, 12, 10, 13, 15]
 */
export function generateSparkline(seed: string, days = 7, baseValue = 10): number[] {
  // Simple hash function for consistent seeding
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Seeded random function
  let seedValue = Math.abs(hash);
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const values: number[] = [];
  let currentValue = baseValue;

  for (let i = 0; i < days; i++) {
    // Random walk: +/- 0-3 each day
    const change = Math.floor(seededRandom() * 7) - 3; // -3 to +3
    currentValue = Math.max(0, currentValue + change); // No negatives
    values.push(Math.round(currentValue));
  }

  return values;
}

// ============================================
// Date Range Helpers
// ============================================

export interface WeekRange {
  start: Date;
  end: Date;
}

/**
 * Get date range for current week (last 7 days)
 */
export function getCurrentWeekRange(): WeekRange {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

/**
 * Get date range for previous week (7-14 days ago)
 */
export function getPreviousWeekRange(): WeekRange {
  const now = new Date();
  const end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Count items created within date range
 */
export function countInDateRange<T extends { createdAt: string }>(
  items: T[],
  range: WeekRange
): number {
  return items.filter(item => {
    const createdDate = new Date(item.createdAt);
    return createdDate >= range.start && createdDate <= range.end;
  }).length;
}

// ============================================
// AI Coverage Calculation
// ============================================

/**
 * Calculate AI coverage percentage based on course ID (mock)
 *
 * @param courseId - Course identifier
 * @returns Percentage between 60-80%
 */
export function calculateAICoverage(courseId: string): number {
  // Simple hash to get consistent value
  const hash = courseId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Map hash to 60-80% range
  const percentage = 60 + (Math.abs(hash) % 21);
  return percentage;
}
