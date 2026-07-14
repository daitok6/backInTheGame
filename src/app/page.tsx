import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { dailyLogs, settings as settingsTable } from "@/db/schema";
import { Dashboard, type TodoRow } from "@/components/Dashboard";
import { todayInTimezone, lastNDays } from "@/lib/date";
import type { DaySlot } from "@/lib/centralization";

// Single-user personal tracker — always read fresh data, no static caching.
export const dynamic = "force-dynamic";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";
const DEFAULT_FLIGHT_DATE = "2026-08-04";
const TREND_WINDOW_DAYS = 14;

export default async function Home() {
  const settingsRow = await db.query.settings.findFirst({
    where: eq(settingsTable.id, 1),
  });
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const flightDate = settingsRow?.flightDate ?? DEFAULT_FLIGHT_DATE;
  const today = todayInTimezone(timezone);
  const windowDates = lastNDays(today, TREND_WINDOW_DAYS);

  const [todayLogRow, windowLogs, todoRows] = await Promise.all([
    db.query.dailyLogs.findFirst({ where: eq(dailyLogs.date, today) }),
    db.query.dailyLogs.findMany({ where: inArray(dailyLogs.date, windowDates) }),
    db.query.todos.findMany(),
  ]);

  const logByDate = new Map(windowLogs.map((log) => [log.date, log]));
  const recentDays: DaySlot[] = windowDates.map((date) => ({
    date,
    reach: logByDate.get(date)?.reach ?? null,
  }));

  return (
    <Dashboard
      today={today}
      flightDate={flightDate}
      todayLog={
        todayLogRow
          ? {
              pain: todayLogRow.pain,
              reach: todayLogRow.reach,
              note: todayLogRow.note ?? "",
              checks: (todayLogRow.checks as Record<string, boolean>) ?? {},
            }
          : null
      }
      todos={todoRows as TodoRow[]}
      recentDays={recentDays}
    />
  );
}
