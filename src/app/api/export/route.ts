import { NextResponse } from "next/server";
import { db } from "@/db";
import { toCsv, type LogRow } from "@/lib/stats";

export async function GET() {
  const rows = await db.query.dailyLogs.findMany({
    orderBy: (logs, { asc }) => [asc(logs.date)],
  });

  const logs: LogRow[] = rows.map((row) => ({
    date: row.date,
    pain: row.pain,
    reach: row.reach,
    note: row.note ?? "",
    checks: (row.checks as Record<string, boolean>) ?? {},
  }));

  const csv = toCsv(logs);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="back-in-the-game-export.csv"`,
    },
  });
}
