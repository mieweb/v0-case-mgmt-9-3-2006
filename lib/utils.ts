import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or Date object to mm/dd/yyyy format
 * @param date - Date string (ISO, yyyy-mm-dd, etc.) or Date object
 * @returns Formatted date string in mm/dd/yyyy format, or empty string if invalid
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ""
  
  const d = typeof date === "string" ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ""
  
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const year = d.getFullYear()
  
  return `${month}/${day}/${year}`
}
