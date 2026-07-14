CREATE TABLE "foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"calories_per_serving" real DEFAULT 0 NOT NULL,
	"protein_g" real DEFAULT 0 NOT NULL,
	"carbs_g" real,
	"fat_g" real,
	"serving_label" text DEFAULT 'serving',
	"is_custom" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "foods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "guided_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"duration_seconds" integer,
	"reps" integer,
	"video_url" text
);
--> statement-breakpoint
CREATE TABLE "guided_workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"food_id" integer,
	"custom_name" text,
	"servings" real DEFAULT 1 NOT NULL,
	"meal" text DEFAULT 'snack' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "calorie_target" integer;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "protein_target" integer;--> statement-breakpoint
ALTER TABLE "guided_steps" ADD CONSTRAINT "guided_steps_workout_id_guided_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."guided_workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_entries" ADD CONSTRAINT "nutrition_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;