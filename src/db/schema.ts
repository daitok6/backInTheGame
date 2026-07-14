import {
  serial,
  integer,
  real,
  text,
  date,
  boolean,
  jsonb,
  timestamp,
  pgTable,
  unique,
} from "drizzle-orm/pg-core";

/**
 * One row per calendar day. Pain check-in + checklist state lives here.
 */
export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  pain: integer("pain").notNull().default(0), // 0-10 intensity
  // reach: 0 none, 1 back only, 2 butt, 3 thigh, 4 calf, 5 foot
  reach: integer("reach").notNull().default(0),
  note: text("note").default(""),
  // { [checklistItemId: string]: boolean }
  checks: jsonb("checks").notNull().default({}),
});

/**
 * One-time relocation to-dos, grouped by phase. Seeded from src/lib/content.ts.
 */
export const todos = pgTable(
  "todos",
  {
    id: serial("id").primaryKey(),
    phase: text("phase").notNull(), // 'pre' | 'flight' | 'kl'
    itemId: text("item_id").notNull(),
    done: boolean("done").notNull().default(false),
  },
  (table) => [unique().on(table.phase, table.itemId)],
);

/**
 * Single-row app settings.
 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  flightDate: date("flight_date", { mode: "string" })
    .notNull()
    .default("2026-08-04"),
  reminderTime: text("reminder_time").default("08:00"),
  timezone: text("timezone").default("Asia/Kuala_Lumpur"),
  weightUnit: text("weight_unit").default("kg"),
  restTimerSeconds: integer("rest_timer_seconds").notNull().default(90),
  calorieTarget: integer("calorie_target"),
  proteinTarget: integer("protein_target"),
});

/**
 * Web Push subscriptions for the daily reminder.
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  subscription: jsonb("subscription").notNull(),
});

/**
 * Structured exercise library used for workout logging (distinct from the
 * static video-library content in src/lib/content.ts, which is just form
 * references). Seeded with a starter list; users can add their own.
 */
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  muscleGroup: text("muscle_group"),
  isCustom: boolean("is_custom").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * One workout session per logging action — a date plus an optional label
 * (e.g. "Push day"). Phase-independent: not tied to pre/flight/kl. Multiple
 * sessions per day are allowed.
 */
export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  label: text("label").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * A single logged set (weight x reps [+ RPE/note]) within a session.
 */
export const workoutSets = pgTable("workout_sets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setOrder: integer("set_order").notNull().default(0),
  weight: real("weight").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  rpe: real("rpe"),
  note: text("note").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * A saved, reusable workout template (e.g. "Push Day").
 */
export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  note: text("note").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * One exercise slot within a routine, with optional targets that pre-fill
 * the logging form when a workout is started from this routine.
 */
export const routineExercises = pgTable("routine_exercises", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer("order_index").notNull().default(0),
  targetSets: integer("target_sets"),
  targetReps: integer("target_reps"),
  targetWeight: real("target_weight"),
});

/**
 * A food item usable in nutrition entries — either from a small seeded/user
 * library (isCustom: false/true) or defined ad hoc via a freeform entry.
 */
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  caloriesPerServing: real("calories_per_serving").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g"),
  fatG: real("fat_g"),
  servingLabel: text("serving_label").default("serving"),
  isCustom: boolean("is_custom").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * One logged food entry for a given day and meal. Either references a saved
 * `foods` row, or stands alone via `customName` for a one-off freeform log.
 */
export const nutritionEntries = pgTable("nutrition_entries", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  foodId: integer("food_id").references(() => foods.id),
  customName: text("custom_name"),
  servings: real("servings").notNull().default(1),
  meal: text("meal").notNull().default("snack"), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * A saved, reusable guided/follow-along workout (Nike-style step player).
 */
export const guidedWorkouts = pgTable("guided_workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * One step within a guided workout — either time-based (durationSeconds) or
 * rep-based (reps), with an optional form-reference video URL.
 */
export const guidedSteps = pgTable("guided_steps", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => guidedWorkouts.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  name: text("name").notNull(),
  durationSeconds: integer("duration_seconds"),
  reps: integer("reps"),
  videoUrl: text("video_url"),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type NutritionEntry = typeof nutritionEntries.$inferSelect;
export type GuidedWorkout = typeof guidedWorkouts.$inferSelect;
export type GuidedStep = typeof guidedSteps.$inferSelect;
