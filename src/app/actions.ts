"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dailyLogs, todos, settings } from "@/db/schema";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const upsertDailyLogSchema = z.object({
  date: dateSchema,
  pain: z.number().int().min(0).max(10).optional(),
  reach: z.number().int().min(0).max(5).optional(),
  note: z.string().max(4000).optional(),
  checks: z.record(z.string(), z.boolean()).optional(),
});

export type UpsertDailyLogInput = z.infer<typeof upsertDailyLogSchema>;

/**
 * Upserts today's daily_logs row. `checks` is merged with whatever is
 * already stored (partial patch), other fields overwrite when present.
 */
export async function upsertDailyLog(input: UpsertDailyLogInput) {
  const data = upsertDailyLogSchema.parse(input);

  const existing = await db.query.dailyLogs.findFirst({
    where: eq(dailyLogs.date, data.date),
  });

  const mergedChecks = data.checks
    ? { ...((existing?.checks as Record<string, boolean>) ?? {}), ...data.checks }
    : undefined;

  const setFields: Partial<typeof dailyLogs.$inferInsert> = {};
  if (data.pain !== undefined) setFields.pain = data.pain;
  if (data.reach !== undefined) setFields.reach = data.reach;
  if (data.note !== undefined) setFields.note = data.note;
  if (mergedChecks !== undefined) setFields.checks = mergedChecks;

  await db
    .insert(dailyLogs)
    .values({ date: data.date, ...setFields })
    .onConflictDoUpdate({ target: dailyLogs.date, set: setFields });

  revalidatePath("/");
  revalidatePath("/history");

  return { ok: true as const };
}

const toggleTodoSchema = z.object({
  phase: z.enum(["pre", "flight", "kl"]),
  itemId: z.string().min(1),
  done: z.boolean(),
});

export async function toggleTodo(input: z.infer<typeof toggleTodoSchema>) {
  const data = toggleTodoSchema.parse(input);

  await db
    .insert(todos)
    .values({ phase: data.phase, itemId: data.itemId, done: data.done })
    .onConflictDoUpdate({
      target: [todos.phase, todos.itemId],
      set: { done: data.done },
    });

  revalidatePath("/");
  return { ok: true as const };
}

const updateSettingsSchema = z.object({
  flightDate: dateSchema.optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Expected HH:MM")
    .optional(),
  timezone: z.string().min(1).optional(),
});

export async function updateSettings(input: z.infer<typeof updateSettingsSchema>) {
  const data = updateSettingsSchema.parse(input);

  const setFields: Partial<typeof settings.$inferInsert> = {};
  if (data.flightDate !== undefined) setFields.flightDate = data.flightDate;
  if (data.reminderTime !== undefined) setFields.reminderTime = data.reminderTime;
  if (data.timezone !== undefined) setFields.timezone = data.timezone;

  await db
    .insert(settings)
    .values({ id: 1, ...setFields })
    .onConflictDoUpdate({ target: settings.id, set: setFields });

  revalidatePath("/");
  return { ok: true as const };
}
