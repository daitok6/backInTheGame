import {
  serial,
  integer,
  text,
  date,
  boolean,
  jsonb,
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
});

/**
 * Web Push subscriptions for the daily reminder.
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  subscription: jsonb("subscription").notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
