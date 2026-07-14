CREATE TABLE "daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"pain" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"note" text DEFAULT '',
	"checks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "daily_logs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"flight_date" date DEFAULT '2026-08-04' NOT NULL,
	"reminder_time" text DEFAULT '08:00',
	"timezone" text DEFAULT 'Asia/Kuala_Lumpur'
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"phase" text NOT NULL,
	"item_id" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	CONSTRAINT "todos_phase_item_id_unique" UNIQUE("phase","item_id")
);
