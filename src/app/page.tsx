import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { WorkoutLog } from "@/components/WorkoutLog";
import { getWorkoutDay } from "@/app/workout-actions";
import { getRoutines } from "@/app/routine-actions";
import { todayInTimezone } from "@/lib/date";

// Single-user personal tracker — always read fresh data, no static caching.
export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";
const DEFAULT_WEIGHT_UNIT = "kg";
const DEFAULT_REST_TIMER_SECONDS = 90;

export default async function Home() {
  const settingsRow = await db.query.settings.findFirst({
    where: eq(settingsTable.id, 1),
  });
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const weightUnit = settingsRow?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const restTimerSeconds = settingsRow?.restTimerSeconds ?? DEFAULT_REST_TIMER_SECONDS;
  const today = todayInTimezone(timezone);

  const [exerciseRows, todaysSets, routines] = await Promise.all([
    db.query.exercises.findMany({ orderBy: (ex, { asc }) => [asc(ex.name)] }),
    getWorkoutDay(today),
    getRoutines(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-semibold">Workouts</h1>
      <WorkoutLog
        today={today}
        initialExercises={exerciseRows.map((e) => ({ id: e.id, name: e.name }))}
        initialSets={todaysSets}
        weightUnit={weightUnit}
        routines={routines}
        restTimerSeconds={restTimerSeconds}
      />
    </main>
  );
}
