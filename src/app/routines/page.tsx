import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { RoutineManager } from "@/components/RoutineManager";
import { getRoutines } from "@/app/routine-actions";

export const dynamic = "force-dynamic";

const DEFAULT_WEIGHT_UNIT = "kg";

export default async function RoutinesPage() {
  const [settingsRow, routines, exerciseRows] = await Promise.all([
    db.query.settings.findFirst({ where: eq(settingsTable.id, 1) }),
    getRoutines(),
    db.query.exercises.findMany({ orderBy: (ex, { asc }) => [asc(ex.name)] }),
  ]);
  const weightUnit = settingsRow?.weightUnit ?? DEFAULT_WEIGHT_UNIT;

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-semibold">Routines</h1>
      <RoutineManager
        initialRoutines={routines}
        initialExercises={exerciseRows.map((e) => ({ id: e.id, name: e.name }))}
        weightUnit={weightUnit}
      />
    </main>
  );
}
