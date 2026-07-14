import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable } from "@/db/schema";
import { HistoryView } from "@/components/HistoryView";
import { todayInTimezone } from "@/lib/date";
import { getAllSessionsSummary } from "@/app/workout-actions";
import type { LogRow } from "@/lib/stats";

export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";
const DEFAULT_WEIGHT_UNIT = "kg";

export default async function HistoryPage() {
  const settingsRow = await db.query.settings.findFirst({
    where: eq(settingsTable.id, 1),
  });
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const weightUnit = settingsRow?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const today = todayInTimezone(timezone);

  const [rows, exerciseRows, sessions] = await Promise.all([
    db.query.dailyLogs.findMany({ orderBy: (logs, { asc }) => [asc(logs.date)] }),
    db.query.exercises.findMany({ orderBy: (ex, { asc }) => [asc(ex.name)] }),
    getAllSessionsSummary(),
  ]);

  const logs: LogRow[] = rows.map((row) => ({
    date: row.date,
    pain: row.pain,
    reach: row.reach,
    note: row.note ?? "",
    checks: (row.checks as Record<string, boolean>) ?? {},
  }));

  return (
    <HistoryView
      logs={logs}
      today={today}
      exercises={exerciseRows.map((e) => ({ id: e.id, name: e.name }))}
      sessions={sessions}
      weightUnit={weightUnit}
    />
  );
}
