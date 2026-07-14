"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { foods, nutritionEntries, settings } from "@/db/schema";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const mealSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export interface NutritionEntryView {
  id: number;
  date: string;
  meal: z.infer<typeof mealSchema>;
  name: string;
  servings: number;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  servingLabel: string;
}

/** Read-only: every entry logged for a given date, joined with its food's
 * macros (or the freeform name if it wasn't linked to a saved food). */
export async function getNutritionDay(dateInput: string): Promise<NutritionEntryView[]> {
  const date = dateSchema.parse(dateInput);

  const entries = await db.query.nutritionEntries.findMany({ where: eq(nutritionEntries.date, date) });
  if (entries.length === 0) return [];

  const foodIds = [...new Set(entries.map((e) => e.foodId).filter((id): id is number => id !== null))];
  const foodRows =
    foodIds.length > 0 ? await db.query.foods.findMany({ where: inArray(foods.id, foodIds) }) : [];
  const foodById = new Map(foodRows.map((f) => [f.id, f]));

  return entries.map((e) => {
    const food = e.foodId !== null ? foodById.get(e.foodId) : undefined;
    return {
      id: e.id,
      date: e.date,
      meal: mealSchema.parse(e.meal),
      name: food?.name ?? e.customName ?? "Unknown",
      servings: e.servings,
      caloriesPerServing: food?.caloriesPerServing ?? 0,
      proteinG: food?.proteinG ?? 0,
      carbsG: food?.carbsG ?? null,
      fatG: food?.fatG ?? null,
      servingLabel: food?.servingLabel ?? "serving",
    };
  });
}

export interface FoodOption {
  id: number;
  name: string;
  caloriesPerServing: number;
  proteinG: number;
  servingLabel: string;
}

/** Read-only: the food library for the picker, alphabetical. */
export async function searchFoods(): Promise<FoodOption[]> {
  const rows = await db.query.foods.findMany({ orderBy: (f, { asc }) => [asc(f.name)] });
  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    caloriesPerServing: f.caloriesPerServing,
    proteinG: f.proteinG,
    servingLabel: f.servingLabel ?? "serving",
  }));
}

const createFoodSchema = z.object({
  name: z.string().min(1).max(120),
  caloriesPerServing: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000).default(0),
  carbsG: z.number().min(0).max(1000).optional(),
  fatG: z.number().min(0).max(1000).optional(),
  servingLabel: z.string().max(40).optional(),
});

export async function createFood(input: z.infer<typeof createFoodSchema>) {
  const data = createFoodSchema.parse(input);
  const [row] = await db
    .insert(foods)
    .values({
      name: data.name,
      caloriesPerServing: data.caloriesPerServing,
      proteinG: data.proteinG,
      carbsG: data.carbsG,
      fatG: data.fatG,
      servingLabel: data.servingLabel ?? "serving",
      isCustom: true,
    })
    .onConflictDoUpdate({
      target: foods.name,
      // No real change on conflict — just forces a row back via .returning().
      set: { name: data.name },
    })
    .returning();
  revalidatePath("/nutrition");
  return row;
}

const logFoodSchema = z.object({
  date: dateSchema,
  meal: mealSchema,
  foodId: z.number().int().positive().optional(),
  customName: z.string().max(120).optional(),
  servings: z.number().min(0.1).max(50).default(1),
});

export async function logFood(input: z.infer<typeof logFoodSchema>) {
  const data = logFoodSchema.parse(input);
  if (!data.foodId && !data.customName) {
    throw new Error("Either foodId or customName is required");
  }

  const [row] = await db
    .insert(nutritionEntries)
    .values({
      date: data.date,
      meal: data.meal,
      foodId: data.foodId,
      customName: data.customName,
      servings: data.servings,
    })
    .returning();

  revalidatePath("/nutrition");
  return row;
}

const updateEntrySchema = z.object({
  id: z.number().int().positive(),
  servings: z.number().min(0.1).max(50).optional(),
  meal: mealSchema.optional(),
});

export async function updateEntry(input: z.infer<typeof updateEntrySchema>) {
  const data = updateEntrySchema.parse(input);
  const setFields: Partial<typeof nutritionEntries.$inferInsert> = {};
  if (data.servings !== undefined) setFields.servings = data.servings;
  if (data.meal !== undefined) setFields.meal = data.meal;

  await db.update(nutritionEntries).set(setFields).where(eq(nutritionEntries.id, data.id));
  revalidatePath("/nutrition");
  return { ok: true as const };
}

const deleteEntrySchema = z.object({ id: z.number().int().positive() });

export async function deleteEntry(input: z.infer<typeof deleteEntrySchema>) {
  const data = deleteEntrySchema.parse(input);
  await db.delete(nutritionEntries).where(eq(nutritionEntries.id, data.id));
  revalidatePath("/nutrition");
  return { ok: true as const };
}

const updateNutritionTargetsSchema = z.object({
  calorieTarget: z.number().int().min(0).max(20000).optional(),
  proteinTarget: z.number().int().min(0).max(2000).optional(),
});

export async function updateNutritionTargets(
  input: z.infer<typeof updateNutritionTargetsSchema>,
) {
  const data = updateNutritionTargetsSchema.parse(input);
  const setFields: Partial<typeof settings.$inferInsert> = {};
  if (data.calorieTarget !== undefined) setFields.calorieTarget = data.calorieTarget;
  if (data.proteinTarget !== undefined) setFields.proteinTarget = data.proteinTarget;

  await db.update(settings).set(setFields).where(eq(settings.id, 1));
  revalidatePath("/nutrition");
  return { ok: true as const };
}
