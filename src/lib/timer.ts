/** Remaining seconds given a start time, duration, and "now" — clamped to
 * [0, durationSeconds]. Deriving remaining time from a fixed end timestamp
 * (rather than decrementing a counter every tick) keeps the timer correct
 * across backgrounded tabs, missed intervals, etc. */
export function remainingSeconds(
  startedAtMs: number,
  durationSeconds: number,
  nowMs: number,
): number {
  const elapsedSeconds = (nowMs - startedAtMs) / 1000;
  const remaining = durationSeconds - elapsedSeconds;
  return Math.max(0, Math.min(durationSeconds, Math.ceil(remaining)));
}

/** Formats whole seconds as M:SS. */
export function formatMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
