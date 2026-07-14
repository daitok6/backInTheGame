"use server";

import { revalidatePath } from "next/cache";
import { eq, and, count, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { exercises, workoutSessions, workoutSets } from "@/db/schema";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export interface WorkoutSetView {
  id: number;
  sessionId: number;
  exerciseId: number;
  exerciseName: string;
  sessionLabel: string;
  setOrder: number;
  weight: number;
  reps: number;
  rpe: number | null;
  note: string;
}

/** Read-only: all sets logged for a given date, joined with exercise name
 * and session label, ordered by exercise then set order. Used by the
 * Workouts page (today or a picked date) and reused for date-change fetches
 * client-side. */
export async function getWorkoutDay(dateInput: string): Promise<WorkoutSetView[]> {
  const date = dateSchema.parse(dateInput);

  const sessions = await db.query.workoutSessions.findMany({
    where: eq(workoutSessions.date, date),
  });
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const sets = await db.query.workoutSets.findMany({
    where: inArray(workoutSets.sessionId, sessionIds),
  });
  if (sets.length === 0) return [];

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exerciseRows = await db.query.exercises.findMany({
    where: inArray(exercises.id, exerciseIds),
  });
  const exerciseById = new Map(exerciseRows.map((e) => [e.id, e]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  return sets
    .map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      exerciseId: s.exerciseId,
      exerciseName: exerciseById.get(s.exerciseId)?.name ?? "Unknown",
      sessionLabel: sessionById.get(s.sessionId)?.label ?? "",
      setOrder: s.setOrder,
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
      note: s.note ?? "",
    }))
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName) || a.setOrder - b.setOrder);
}

const createExerciseSchema = z.object({
  name: z.string().min(1).max(120),
  muscleGroup: z.string().max(60).optional(),
});

/** Creates an exercise, or returns the existing one if the name already
 * exists (case-sensitive exact match) — always returns a row via the
 * onConflictDoUpdate-returning trick. */
export async function createExercise(input: z.infer<typeof createExerciseSchema>) {
  const data = createExerciseSchema.parse(input);

  const [row] = await db
    .insert(exercises)
    .values({ name: data.name, muscleGroup: data.muscleGroup, isCustom: true })
    .onConflictDoUpdate({
      target: exercises.name,
      // No real change on conflict — just forces a row back via .returning().
      set: { name: data.name },
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/history");
  return row;
}

const logSetSchema = z.object({
  date: dateSchema,
  sessionLabel: z.string().max(80).optional(),
  exerciseId: z.number().int().positive(),
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(1000),
  rpe: z.number().min(0).max(10).optional(),
  note: z.string().max(500).optional(),
});

/** Finds-or-creates the session for (date, label) and appends a set with
 * the next set_order for that exercise within it. */
export async function logSet(input: z.infer<typeof logSetSchema>) {
  const data = logSetSchema.parse(input);
  const label = data.sessionLabel ?? "";

  let session = await db.query.workoutSessions.findFirst({
    where: and(eq(workoutSessions.date, data.date), eq(workoutSessions.label, label)),
  });

  if (!session) {
    [session] = await db
      .insert(workoutSessions)
      .values({ date: data.date, label })
      .returning();
  }

  const [{ value: existingSetCount }] = await db
    .select({ value: count() })
    .from(workoutSets)
    .where(
      and(eq(workoutSets.sessionId, session.id), eq(workoutSets.exerciseId, data.exerciseId)),
    );

  const [newSet] = await db
    .insert(workoutSets)
    .values({
      sessionId: session.id,
      exerciseId: data.exerciseId,
      setOrder: existingSetCount,
      weight: data.weight,
      reps: data.reps,
      rpe: data.rpe,
      note: data.note ?? "",
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/history");
  return { session, set: newSet };
}

const updateSetSchema = z.object({
  id: z.number().int().positive(),
  weight: z.number().min(0).max(2000).optional(),
  reps: z.number().int().min(0).max(1000).optional(),
  rpe: z.number().min(0).max(10).optional(),
  note: z.string().max(500).optional(),
});

export async function updateSet(input: z.infer<typeof updateSetSchema>) {
  const data = updateSetSchema.parse(input);
  const setFields: Partial<typeof workoutSets.$inferInsert> = {};
  if (data.weight !== undefined) setFields.weight = data.weight;
  if (data.reps !== undefined) setFields.reps = data.reps;
  if (data.rpe !== undefined) setFields.rpe = data.rpe;
  if (data.note !== undefined) setFields.note = data.note;

  await db.update(workoutSets).set(setFields).where(eq(workoutSets.id, data.id));

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true as const };
}

const deleteSetSchema = z.object({ id: z.number().int().positive() });

export async function deleteSet(input: z.infer<typeof deleteSetSchema>) {
  const data = deleteSetSchema.parse(input);
  await db.delete(workoutSets).where(eq(workoutSets.id, data.id));
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true as const };
}

const updateSessionLabelSchema = z.object({
  id: z.number().int().positive(),
  label: z.string().max(80),
});

export async function updateSessionLabel(input: z.infer<typeof updateSessionLabelSchema>) {
  const data = updateSessionLabelSchema.parse(input);
  await db
    .update(workoutSessions)
    .set({ label: data.label })
    .where(eq(workoutSessions.id, data.id));
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true as const };
}
