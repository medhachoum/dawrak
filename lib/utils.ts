import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert Western (0-9) digits in a string to Arabic-Indic digits (٠-٩).
 */
export function toArabicDigits(input: string | number): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(input).replace(/\d/g, (d) => map[Number(d)] ?? d);
}

/**
 * Format a ticket number for display (e.g. 7 -> "A-٠٠٧").
 */
export function formatTicketNumber(n: number, prefix = "A"): string {
  const padded = n.toString().padStart(3, "0");
  return `${prefix}-${toArabicDigits(padded)}`;
}

/**
 * Estimate wait time in minutes from position in queue and avg service time.
 */
export function estimateWaitMinutes(
  positionFromHead: number,
  avgServiceTime: number,
): number {
  if (positionFromHead <= 0) return 0;
  return positionFromHead * avgServiceTime;
}
