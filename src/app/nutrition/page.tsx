import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { NutritionLog } from "@/components/NutritionLog";
import { getNutritionDay, searchFoods } from "@/app/nutrition-actions";
import { todayInTimezone } from "@/lib/date";

export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";

export default async function NutritionPage() {
  const settingsRow = await db.query.settings.findFirst({ where: eq(settingsTable.id, 1) });
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const today = todayInTimezone(timezone);

  const [entries, foods] = await Promise.all([getNutritionDay(today), searchFoods()]);

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-semibold">Nutrition</h1>
      <NutritionLog
        today={today}
        initialEntries={entries}
        initialFoods={foods}
        calorieTarget={settingsRow?.calorieTarget ?? null}
        proteinTarget={settingsRow?.proteinTarget ?? null}
      />
    </main>
  );
}
