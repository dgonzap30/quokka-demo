import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate user initials from full name
 * @param name - User's full name
 * @returns First letter of first and last name (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return "?"
  }

  const parts = name.trim().split(/\s+/)

  if (parts.length === 1) {
    // Single name: return first letter
    return parts[0].charAt(0).toUpperCase()
  }

  // Multiple names: return first letter of first and last name
  const firstInitial = parts[0].charAt(0).toUpperCase()
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`
}

/**
 * Format a date as a relative time string (ChatGPT/Claude style)
 * @param date - Date string or Date object
 * @returns Relative time string ("2m ago", "1h ago", "Yesterday", etc.)
 * @example
 * formatTimeAgo(new Date()) // "Just now"
 * formatTimeAgo("2024-01-15T10:30:00") // "2 hours ago"
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now.getTime() - past.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return "Just now"
  }

  // Less than 1 hour: show minutes
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  // Less than 24 hours: show hours
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  // Yesterday (1-2 days ago)
  if (diffInDays === 1) {
    return "Yesterday"
  }

  // Within last week (2-7 days)
  if (diffInDays < 7) {
    return `${diffInDays} days ago`
  }

  // Within last month (7-30 days)
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`
  }

  // More than 30 days: show absolute date
  return past.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: past.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}
