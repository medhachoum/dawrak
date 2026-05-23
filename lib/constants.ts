export const QUEUE_STATUS = {
  active: "active",
  paused: "paused",
  closed: "closed",
} as const;

export type QueueStatus = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];

export const QUEUE_STATUS_AR: Record<QueueStatus, string> = {
  active: "نشط",
  paused: "متوقف مؤقتاً",
  closed: "مغلق",
};

export const QUEUE_ENTRY_STATUS = {
  waiting: "waiting",
  called: "called",
  serving: "serving",
  completed: "completed",
  noshow: "noshow",
} as const;

export type QueueEntryStatus =
  (typeof QUEUE_ENTRY_STATUS)[keyof typeof QUEUE_ENTRY_STATUS];

export const QUEUE_ENTRY_STATUS_AR: Record<QueueEntryStatus, string> = {
  waiting: "في الانتظار",
  called: "تم النداء",
  serving: "قيد الخدمة",
  completed: "اكتمل",
  noshow: "لم يحضر",
};
