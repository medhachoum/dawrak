import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

export function timeAgoAr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ar });
}

export function formatTimeAr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "p", { locale: ar });
}

export function formatDateAr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "PPP", { locale: ar });
}
