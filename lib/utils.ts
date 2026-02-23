import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard date formatter for the UI
 * Format: "Oct 24, 2023" or "Oct 24, 2023, 2:30 PM"
 */
export function formatDate(
  date: string | Date,
  includeTime: boolean = false
): string {
  const d = new Date(date);
  
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}

/**
 * Formats file sizes for the Media Upload table
 */
export function formatFileSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}