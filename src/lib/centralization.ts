export type Verdict = "retreating" | "spreading" | "steady" | "insufficient";

export interface DaySlot {
  date: string;
  reach: number | null; // null = unlogged day
}

export interface CentralizationResult {
  verdict: Verdict;
  firstHalfAvg: number | null;
  secondHalfAvg: number | null;
  loggedCount: number;
}

const STEADY_EPSILON = 0.4; // ignore avg differences smaller than this

/**
 * Compares the average reach of the first half vs. the second half of
 * *logged* days (chronological order) within the given window. Fewer than 2
 * logged days is "insufficient" — not enough signal for a verdict.
 *
 * Lower reach = pain has retreated toward the spine = improvement.
 */
export function computeCentralization(days: DaySlot[]): CentralizationResult {
  const logged = days
    .filter((d): d is DaySlot & { reach: number } => d.reach !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (logged.length < 2) {
    return {
      verdict: "insufficient",
      firstHalfAvg: null,
      secondHalfAvg: null,
      loggedCount: logged.length,
    };
  }

  const mid = Math.ceil(logged.length / 2);
  const firstHalf = logged.slice(0, mid);
  const secondHalf = logged.slice(mid);

  const avg = (arr: { reach: number }[]) =>
    arr.reduce((sum, d) => sum + d.reach, 0) / arr.length;

  const firstHalfAvg = avg(firstHalf);
  const secondHalfAvg = avg(secondHalf.length > 0 ? secondHalf : firstHalf);

  const delta = secondHalfAvg - firstHalfAvg;
  let verdict: Verdict;
  if (delta <= -STEADY_EPSILON) verdict = "retreating";
  else if (delta >= STEADY_EPSILON) verdict = "spreading";
  else verdict = "steady";

  return { verdict, firstHalfAvg, secondHalfAvg, loggedCount: logged.length };
}

export const VERDICT_TEXT: Record<Verdict, string> = {
  retreating: "▲ Pain is retreating — keep the plan",
  spreading: "▼ Pain reaching further — ease off",
  steady: "● Holding steady",
  insufficient: "Log a few more days to see the trend",
};
