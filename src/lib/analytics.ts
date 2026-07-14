export interface AnalyticsSetRow {
  sessionId: number;
  sessionDate: string; // YYYY-MM-DD
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string | null;
  weight: number;
  reps: number;
}

export interface MuscleGroupVolume {
  muscleGroup: string;
  volume: number;
}

/** Total tonnage (weight x reps) per muscle group, largest first. Sets on
 * exercises with no assigned muscle group are bucketed under "Other". */
export function muscleGroupVolume(rows: AnalyticsSetRow[]): MuscleGroupVolume[] {
  const byGroup = new Map<string, number>();
  for (const r of rows) {
    const group = r.muscleGroup?.trim() || "Other";
    byGroup.set(group, (byGroup.get(group) ?? 0) + r.weight * r.reps);
  }
  return Array.from(byGroup.entries())
    .map(([muscleGroup, volume]) => ({ muscleGroup, volume }))
    .sort((a, b) => b.volume - a.volume);
}

export interface WeeklyVolumePoint {
  weekStart: string; // YYYY-MM-DD, Monday
  volume: number;
}

/** The Monday (in UTC, to match how dates are stored/compared elsewhere in
 * this app) that starts the ISO week containing `dateStr`. */
export function isoWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** Total tonnage per ISO week, oldest week first. */
export function weeklyVolume(rows: AnalyticsSetRow[]): WeeklyVolumePoint[] {
  const byWeek = new Map<string, number>();
  for (const r of rows) {
    const week = isoWeekStart(r.sessionDate);
    byWeek.set(week, (byWeek.get(week) ?? 0) + r.weight * r.reps);
  }
  return Array.from(byWeek.entries())
    .map(([weekStart, volume]) => ({ weekStart, volume }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0));
}

export interface TopExercise {
  exerciseId: number;
  exerciseName: string;
  setCount: number;
}

/** The most-logged exercises by set count, largest first, capped at `limit`. */
export function topExercisesByFrequency(rows: AnalyticsSetRow[], limit = 5): TopExercise[] {
  const byExercise = new Map<number, TopExercise>();
  for (const r of rows) {
    const existing = byExercise.get(r.exerciseId);
    if (existing) {
      existing.setCount += 1;
    } else {
      byExercise.set(r.exerciseId, {
        exerciseId: r.exerciseId,
        exerciseName: r.exerciseName,
        setCount: 1,
      });
    }
  }
  return Array.from(byExercise.values())
    .sort((a, b) => b.setCount - a.setCount)
    .slice(0, limit);
}

export interface MonthlySummary {
  sessionCount: number;
  setCount: number;
  totalVolume: number;
}

/** Sessions/sets/volume for rows falling in the given "YYYY-MM" month. */
export function monthlySummary(rows: AnalyticsSetRow[], month: string): MonthlySummary {
  const inMonth = rows.filter((r) => r.sessionDate.startsWith(month));
  const sessionIds = new Set(inMonth.map((r) => r.sessionId));
  const totalVolume = inMonth.reduce((sum, r) => sum + r.weight * r.reps, 0);
  return {
    sessionCount: sessionIds.size,
    setCount: inMonth.length,
    totalVolume,
  };
}
