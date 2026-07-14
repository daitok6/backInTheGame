import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { getAnalytics } from "@/app/analytics-actions";
import { todayInTimezone } from "@/lib/date";

export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";
const DEFAULT_WEIGHT_UNIT = "kg";

export default async function AnalyticsPage() {
  const settingsRow = await db.query.settings.findFirst({ where: eq(settingsTable.id, 1) });
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const weightUnit = settingsRow?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const currentMonth = todayInTimezone(timezone).slice(0, 7); // YYYY-MM

  const analytics = await getAnalytics(currentMonth);

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-semibold">Analytics</h1>
      <AnalyticsDashboard analytics={analytics} weightUnit={weightUnit} />
    </main>
  );
}
