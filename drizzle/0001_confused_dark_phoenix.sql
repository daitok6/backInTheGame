CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text,
	"is_custom" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"label" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"set_order" integer DEFAULT 0 NOT NULL,
	"weight" real DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"rpe" real,
	"note" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "weight_unit" text DEFAULT 'kg';--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;