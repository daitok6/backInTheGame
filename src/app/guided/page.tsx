import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { GuidedWorkouts } from "@/components/GuidedWorkouts";
import { getGuidedWorkouts } from "@/app/guided-actions";
import { todayInTimezone } from "@/lib/date";

export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";

export default async function GuidedPage() {
  const [settingsRow, workouts] = await Promise.all([
    db.query.settings.findFirst({ where: eq(settingsTable.id, 1) }),
    getGuidedWorkouts(),
  ]);
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const today = todayInTimezone(timezone);

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-semibold">Guided workouts</h1>
      <GuidedWorkouts initialWorkouts={workouts} today={today} />
    </main>
  );
}
