import type { Week, WeekStage } from "../types";

const DAY = 24 * 60 * 60 * 1000;

/** Days from today (local) to the lesson date. Negative = in the past. */
export function daysUntil(lessonDate: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(lessonDate);
  const lesson = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((lesson - today) / DAY);
}

/**
 * Work out which stage a week is in, based on today's date and progress.
 * - done:       after-lesson consolidation complete
 * - after:      lesson has passed, still need to consolidate
 * - today:      lesson is today
 * - preReading: lesson within the pre-reading window -> do pre-reading
 * - upcoming:   lesson further out than the pre-reading window
 *
 * @param preReadingDays how many days before the lesson pre-reading becomes due (default 7)
 */
export function weekStage(week: Week, preReadingDays = 7): WeekStage {
  if (week.afterDone) return "done";
  const d = daysUntil(week.lessonDate);
  if (d < 0) return "after";
  if (d === 0) return "today";
  if (d <= preReadingDays) return "preReading";
  return "upcoming";
}

export const STAGE_META: Record<
  WeekStage,
  { label: string; badge: string; dot: string }
> = {
  upcoming: {
    label: "Upcoming",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  preReading: {
    label: "Pre-reading due",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  today: {
    label: "Lesson today",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  after: {
    label: "Consolidate",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  done: {
    label: "Done",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
};

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function relativeDays(lessonDate: string): string {
  const d = daysUntil(lessonDate);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d > 0) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
}
