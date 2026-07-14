"use server";

import { db } from "@/db";
import {
  monthlySummary,
  muscleGroupVolume,
  topExercisesByFrequency,
  weeklyVolume,
  type AnalyticsSetRow,
  type MonthlySummary,
  type MuscleGroupVolume,
  type TopExercise,
  type WeeklyVolumePoint,
} from "@/lib/analytics";
import { computePrs, type ExercisePrs } from "@/lib/prs";

export interface ExercisePrView extends ExercisePrs {
  exerciseId: number;
  exerciseName: string;
}

export interface AnalyticsView {
  muscleGroupVolume: MuscleGroupVolume[];
  weeklyVolume: WeeklyVolumePoint[];
  topExercises: TopExercise[];
  currentMonth: MonthlySummary & { month: string };
  personalRecords: ExercisePrView[];
}

/** Read-only: assembles every panel on the Analytics page from all logged
 * sets. Small personal dataset, so a full in-memory pass is simplest and
 * matches the read-then-aggregate pattern used elsewhere (workout-actions,
 * stats.ts) rather than pushing aggregation into SQL. */
export async function getAnalytics(month: string): Promise<AnalyticsView> {
  const [sessions, sets, exerciseRows] = await Promise.all([
    db.query.workoutSessions.findMany(),
    db.query.workoutSets.findMany(),
    db.query.exercises.findMany(),
  ]);

  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const exerciseById = new Map(exerciseRows.map((e) => [e.id, e]));

  const rows: AnalyticsSetRow[] = sets
    .map((s) => {
      const session = sessionById.get(s.sessionId);
      const exercise = exerciseById.get(s.exerciseId);
      if (!session || !exercise) return null;
      return {
        sessionId: s.sessionId,
        sessionDate: session.date,
        exerciseId: s.exerciseId,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        weight: s.weight,
        reps: s.reps,
      };
    })
    .filter((r): r is AnalyticsSetRow => r !== null);

  const setsByExercise = new Map<number, AnalyticsSetRow[]>();
  for (const r of rows) {
    const arr = setsByExercise.get(r.exerciseId) ?? [];
    arr.push(r);
    setsByExercise.set(r.exerciseId, arr);
  }

  const personalRecords: ExercisePrView[] = [];
  for (const [exerciseId, exerciseSets] of setsByExercise) {
    const prs = computePrs(exerciseSets);
    if (!prs) continue;
    personalRecords.push({
      exerciseId,
      exerciseName: exerciseSets[0].exerciseName,
      ...prs,
    });
  }
  personalRecords.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

  return {
    muscleGroupVolume: muscleGroupVolume(rows),
    weeklyVolume: weeklyVolume(rows),
    topExercises: topExercisesByFrequency(rows, 5),
    currentMonth: { month, ...monthlySummary(rows, month) },
    personalRecords,
  };
}
