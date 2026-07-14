import { ALL_CHECKLIST_ITEM_IDS } from "./content";

export interface LogRow {
  date: string;
  pain: number;
  reach: number;
  note: string;
  checks: Record<string, boolean>;
}

/** Consecutive logged days ending at (and including) `today`, if today is
 * logged; otherwise the streak ending at the most recent logged day before
 * a gap reaching to today breaks it (i.e. missing today breaks the streak). */
export function currentStreak(logs: LogRow[], today: string): number {
  const dates = new Set(logs.map((l) => l.date));
  let streak = 0;
  let cursor = today;
  while (dates.has(cursor)) {
    streak++;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  const dt = new Date(ms);
  return [
    dt.getUTCFullYear(),
    String(dt.getUTCMonth() + 1).padStart(2, "0"),
    String(dt.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** % of logged days with pain === 0. */
export function painFreePercent(logs: LogRow[]): number {
  if (logs.length === 0) return 0;
  const painFree = logs.filter((l) => l.pain === 0).length;
  return Math.round((painFree / logs.length) * 100);
}

/** Average reach for logs within [monthStart, monthEndExclusive) YYYY-MM. */
export function averageReachForMonth(logs: LogRow[], yearMonth: string): number | null {
  const inMonth = logs.filter((l) => l.date.startsWith(yearMonth));
  if (inMonth.length === 0) return null;
  return inMonth.reduce((sum, l) => sum + l.reach, 0) / inMonth.length;
}

export function yearMonthOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const newY = Math.floor(total / 12);
  const newM = (total % 12) + 1;
  return `${newY}-${String(newM).padStart(2, "0")}`;
}

/** % of possible checklist checks that were checked, across all logs that
 * have at least one checklist item recorded. */
export function checklistCompletionRate(logs: LogRow[]): number {
  let totalPossible = 0;
  let totalChecked = 0;
  for (const log of logs) {
    const keys = Object.keys(log.checks);
    if (keys.length === 0) continue;
    totalPossible += keys.length;
    totalChecked += keys.filter((k) => log.checks[k]).length;
  }
  if (totalPossible === 0) return 0;
  return Math.round((totalChecked / totalPossible) * 100);
}

export function toCsv(logs: LogRow[]): string {
  const header = ["date", "pain", "reach", "note", ...ALL_CHECKLIST_ITEM_IDS];
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const rows = logs.map((log) => {
    const cells = [
      log.date,
      String(log.pain),
      String(log.reach),
      escape(log.note ?? ""),
      ...ALL_CHECKLIST_ITEM_IDS.map((id) => (log.checks[id] ? "true" : "false")),
    ];
    return cells.join(",");
  });
  return [header.join(","), ...rows].join("\n") + "\n";
}
