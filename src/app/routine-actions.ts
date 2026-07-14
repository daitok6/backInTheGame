"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { exercises, routineExercises, routines } from "@/db/schema";

export interface RoutineExerciseView {
  id: number;
  exerciseId: number;
  exerciseName: string;
  orderIndex: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
}

export interface RoutineView {
  id: number;
  name: string;
  note: string;
  exercises: RoutineExerciseView[];
}

/** Read-only: every routine with its exercise slots, joined to exercise
 * names, ordered by name then slot order. Feeds the Routines page and the
 * "Start from routine" picker on the Workouts page. */
export async function getRoutines(): Promise<RoutineView[]> {
  const routineRows = await db.query.routines.findMany({
    orderBy: (r, { asc }) => [asc(r.name)],
  });
  if (routineRows.length === 0) return [];

  const routineIds = routineRows.map((r) => r.id);
  const slotRows = await db.query.routineExercises.findMany({
    where: inArray(routineExercises.routineId, routineIds),
    orderBy: (re, { asc }) => [asc(re.orderIndex)],
  });

  const exerciseIds = [...new Set(slotRows.map((s) => s.exerciseId))];
  const exerciseRows =
    exerciseIds.length > 0
      ? await db.query.exercises.findMany({ where: inArray(exercises.id, exerciseIds) })
      : [];
  const exerciseNameById = new Map(exerciseRows.map((e) => [e.id, e.name]));

  const slotsByRoutine = new Map<number, RoutineExerciseView[]>();
  for (const s of slotRows) {
    const arr = slotsByRoutine.get(s.routineId) ?? [];
    arr.push({
      id: s.id,
      exerciseId: s.exerciseId,
      exerciseName: exerciseNameById.get(s.exerciseId) ?? "Unknown",
      orderIndex: s.orderIndex,
      targetSets: s.targetSets,
      targetReps: s.targetReps,
      targetWeight: s.targetWeight,
    });
    slotsByRoutine.set(s.routineId, arr);
  }

  return routineRows.map((r) => ({
    id: r.id,
    name: r.name,
    note: r.note ?? "",
    exercises: slotsByRoutine.get(r.id) ?? [],
  }));
}

const createRoutineSchema = z.object({
  name: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
});

export async function createRoutine(input: z.infer<typeof createRoutineSchema>) {
  const data = createRoutineSchema.parse(input);
  const [row] = await db
    .insert(routines)
    .values({ name: data.name, note: data.note ?? "" })
    .returning();
  revalidatePath("/routines");
  revalidatePath("/");
  return row;
}

const renameRoutineSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
});

export async function renameRoutine(input: z.infer<typeof renameRoutineSchema>) {
  const data = renameRoutineSchema.parse(input);
  const setFields: Partial<typeof routines.$inferInsert> = { name: data.name };
  if (data.note !== undefined) setFields.note = data.note;
  await db.update(routines).set(setFields).where(eq(routines.id, data.id));
  revalidatePath("/routines");
  revalidatePath("/");
  return { ok: true as const };
}

const deleteRoutineSchema = z.object({ id: z.number().int().positive() });

export async function deleteRoutine(input: z.infer<typeof deleteRoutineSchema>) {
  const data = deleteRoutineSchema.parse(input);
  await db.delete(routines).where(eq(routines.id, data.id));
  revalidatePath("/routines");
  revalidatePath("/");
  return { ok: true as const };
}

const addRoutineExerciseSchema = z.object({
  routineId: z.number().int().positive(),
  exerciseId: z.number().int().positive(),
  targetSets: z.number().int().min(1).max(20).optional(),
  targetReps: z.number().int().min(1).max(1000).optional(),
  targetWeight: z.number().min(0).max(2000).optional(),
});

/** Appends an exercise slot to the end of a routine. */
export async function addRoutineExercise(input: z.infer<typeof addRoutineExerciseSchema>) {
  const data = addRoutineExerciseSchema.parse(input);

  const existing = await db.query.routineExercises.findMany({
    where: eq(routineExercises.routineId, data.routineId),
    orderBy: (re, { asc: asc2 }) => [asc2(re.orderIndex)],
  });
  const nextOrder = existing.length;

  const [row] = await db
    .insert(routineExercises)
    .values({
      routineId: data.routineId,
      exerciseId: data.exerciseId,
      orderIndex: nextOrder,
      targetSets: data.targetSets,
      targetReps: data.targetReps,
      targetWeight: data.targetWeight,
    })
    .returning();

  revalidatePath("/routines");
  revalidatePath("/");
  return row;
}

const removeRoutineExerciseSchema = z.object({ id: z.number().int().positive() });

export async function removeRoutineExercise(input: z.infer<typeof removeRoutineExerciseSchema>) {
  const data = removeRoutineExerciseSchema.parse(input);
  await db.delete(routineExercises).where(eq(routineExercises.id, data.id));
  revalidatePath("/routines");
  revalidatePath("/");
  return { ok: true as const };
}

const reorderRoutineExercisesSchema = z.object({
  routineId: z.number().int().positive(),
  orderedIds: z.array(z.number().int().positive()),
});

/** Rewrites orderIndex for every slot in a routine to match `orderedIds`. */
export async function reorderRoutineExercises(
  input: z.infer<typeof reorderRoutineExercisesSchema>,
) {
  const data = reorderRoutineExercisesSchema.parse(input);

  await Promise.all(
    data.orderedIds.map((id, index) =>
      db
        .update(routineExercises)
        .set({ orderIndex: index })
        .where(eq(routineExercises.id, id)),
    ),
  );

  revalidatePath("/routines");
  revalidatePath("/");
  return { ok: true as const };
}
