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
