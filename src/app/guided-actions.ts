"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { guidedSteps, guidedWorkouts, workoutSessions } from "@/db/schema";

export interface GuidedStepView {
  id: number;
  orderIndex: number;
  name: string;
  durationSeconds: number | null;
  reps: number | null;
  videoUrl: string | null;
}

export interface GuidedWorkoutView {
  id: number;
  name: string;
  description: string;
  steps: GuidedStepView[];
}

/** Read-only: every guided workout with its steps in order, for the
 * Guided page's list and the player. */
export async function getGuidedWorkouts(): Promise<GuidedWorkoutView[]> {
  const workoutRows = await db.query.guidedWorkouts.findMany({
    orderBy: (w, { asc }) => [asc(w.name)],
  });
  if (workoutRows.length === 0) return [];

  const workoutIds = workoutRows.map((w) => w.id);
  const stepRows = await db.query.guidedSteps.findMany({
    where: inArray(guidedSteps.workoutId, workoutIds),
    orderBy: (s, { asc }) => [asc(s.orderIndex)],
  });

  const stepsByWorkout = new Map<number, GuidedStepView[]>();
  for (const s of stepRows) {
    const arr = stepsByWorkout.get(s.workoutId) ?? [];
    arr.push({
      id: s.id,
      orderIndex: s.orderIndex,
      name: s.name,
      durationSeconds: s.durationSeconds,
      reps: s.reps,
      videoUrl: s.videoUrl,
    });
    stepsByWorkout.set(s.workoutId, arr);
  }

  return workoutRows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description ?? "",
    steps: stepsByWorkout.get(w.id) ?? [],
  }));
}

const createGuidedWorkoutSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export async function createGuidedWorkout(input: z.infer<typeof createGuidedWorkoutSchema>) {
  const data = createGuidedWorkoutSchema.parse(input);
  const [row] = await db
    .insert(guidedWorkouts)
    .values({ name: data.name, description: data.description ?? "" })
    .returning();
  revalidatePath("/guided");
  return row;
}

const deleteGuidedWorkoutSchema = z.object({ id: z.number().int().positive() });

export async function deleteGuidedWorkout(input: z.infer<typeof deleteGuidedWorkoutSchema>) {
  const data = deleteGuidedWorkoutSchema.parse(input);
  await db.delete(guidedWorkouts).where(eq(guidedWorkouts.id, data.id));
  revalidatePath("/guided");
  return { ok: true as const };
}

const addStepSchema = z.object({
  workoutId: z.number().int().positive(),
  name: z.string().min(1).max(120),
  durationSeconds: z.number().int().min(1).max(3600).optional(),
  reps: z.number().int().min(1).max(1000).optional(),
  videoUrl: z.string().url().max(500).optional(),
});

/** Appends a step to the end of a guided workout. Exactly one of
 * durationSeconds/reps should be set (time-based vs. rep-based step) —
 * the player treats a step with neither as a manual "tap to continue". */
export async function addStep(input: z.infer<typeof addStepSchema>) {
  const data = addStepSchema.parse(input);

  const existing = await db.query.guidedSteps.findMany({
    where: eq(guidedSteps.workoutId, data.workoutId),
  });
  const nextOrder = existing.length;

  const [row] = await db
    .insert(guidedSteps)
    .values({
      workoutId: data.workoutId,
      orderIndex: nextOrder,
      name: data.name,
      durationSeconds: data.durationSeconds,
      reps: data.reps,
      videoUrl: data.videoUrl,
    })
    .returning();

  revalidatePath("/guided");
  return row;
}

const removeStepSchema = z.object({ id: z.number().int().positive() });

export async function removeStep(input: z.infer<typeof removeStepSchema>) {
  const data = removeStepSchema.parse(input);
  await db.delete(guidedSteps).where(eq(guidedSteps.id, data.id));
  revalidatePath("/guided");
  return { ok: true as const };
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const logGuidedAsSessionSchema = z.object({
  workoutId: z.number().int().positive(),
  date: dateSchema,
});

/** Records a completed guided workout as a normal workout session (with no
 * sets) so it shows up in History alongside regular strength sessions. */
export async function logGuidedAsSession(input: z.infer<typeof logGuidedAsSessionSchema>) {
  const data = logGuidedAsSessionSchema.parse(input);
  const workout = await db.query.guidedWorkouts.findFirst({
    where: eq(guidedWorkouts.id, data.workoutId),
  });
  if (!workout) throw new Error("Guided workout not found");

  const [session] = await db
    .insert(workoutSessions)
    .values({ date: data.date, label: workout.name })
    .returning();

  revalidatePath("/guided");
  revalidatePath("/history");
  return session;
}
