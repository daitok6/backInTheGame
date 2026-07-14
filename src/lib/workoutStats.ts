export interface WorkoutSetRow {
  sessionDate: string;
  weight: number;
  reps: number;
}

export interface ProgressPoint {
  date: string;
  topWeight: number;
}

/** Collapses a flat list of sets (for one exercise, across many sessions)
 * into one point per session date — the heaviest weight logged that day.
 * The standard PR-tracking signal for a strength progress chart. */
export function topWeightBySessionDate(sets: WorkoutSetRow[]): ProgressPoint[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const current = byDate.get(s.sessionDate) ?? 0;
    if (s.weight > current) byDate.set(s.sessionDate, s.weight);
  }
  return Array.from(byDate.entries())
    .map(([date, topWeight]) => ({ date, topWeight }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Total volume (weight x reps summed) per session date, for one exercise. */
export function volumeBySessionDate(sets: WorkoutSetRow[]): ProgressPoint[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const current = byDate.get(s.sessionDate) ?? 0;
    byDate.set(s.sessionDate, current + s.weight * s.reps);
  }
  return Array.from(byDate.entries())
    .map(([date, topWeight]) => ({ date, topWeight }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
