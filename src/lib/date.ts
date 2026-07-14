import type { Phase } from "./content";

/** Returns today's date as YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string): string {
  // en-CA locale formats as YYYY-MM-DD, which is exactly what we store.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Parses a YYYY-MM-DD string into a UTC-midnight timestamp (ms), avoiding
 * local-timezone drift when doing date arithmetic. */
function toUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `fromStr` to `toStr` (positive if `toStr` is later). */
export function daysBetween(fromStr: string, toStr: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((toUtcMs(toStr) - toUtcMs(fromStr)) / MS_PER_DAY);
}

/** Adds (or subtracts, if negative) `days` to a YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const ms = toUtcMs(dateStr) + days * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Default phase from today vs. flight date:
 * more than 1 day before flight -> pre
 * within 1 day of flight (day before/of/after) -> flight
 * more than 1 day after flight -> kl
 */
export function computeDefaultPhase(today: string, flightDate: string): Phase {
  const diff = daysBetween(today, flightDate); // flightDate - today
  if (diff > 1) return "pre";
  if (diff < -1) return "kl";
  return "flight";
}

/** Days until flight (can be negative once flight has passed). */
export function daysUntilFlight(today: string, flightDate: string): number {
  return daysBetween(today, flightDate);
}

/** Last N calendar day strings ending at `today`, oldest first. */
export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
