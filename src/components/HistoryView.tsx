"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  currentStreak,
  painFreePercent,
  averageReachForMonth,
  checklistCompletionRate,
  yearMonthOf,
  shiftYearMonth,
  type LogRow,
} from "@/lib/stats";
import { daysBetween } from "@/lib/date";
import { reachLabel } from "@/lib/content";

type RangeChoice = "30" | "90" | "all";

interface HistoryViewProps {
  logs: LogRow[]; // ascending by date
  today: string;
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-card p-3">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="text-xl font-semibold">{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  unitLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unitLabel: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-ink">{label}</div>
      <div className="text-muted">{unitLabel(payload[0].value)}</div>
    </div>
  );
}

export function HistoryView({ logs, today }: HistoryViewProps) {
  const [range, setRange] = useState<RangeChoice>("30");

  const filteredLogs = useMemo(() => {
    if (range === "all") return logs;
    const windowDays = range === "30" ? 30 : 90;
    return logs.filter((l) => daysBetween(l.date, today) <= windowDays);
  }, [logs, today, range]);

  const chartData = useMemo(
    () =>
      filteredLogs.map((l) => ({
        date: formatShortDate(l.date),
        fullDate: l.date,
        pain: l.pain,
        reach: l.reach,
      })),
    [filteredLogs],
  );

  const streak = currentStreak(logs, today);
  const painFree = painFreePercent(logs);
  const completion = checklistCompletionRate(logs);
  const thisMonth = yearMonthOf(today);
  const lastMonth = shiftYearMonth(thisMonth, -1);
  const avgReachThisMonth = averageReachForMonth(logs, thisMonth);
  const avgReachLastMonth = averageReachForMonth(logs, lastMonth);

  const reachTrendSub =
    avgReachThisMonth !== null && avgReachLastMonth !== null
      ? avgReachThisMonth < avgReachLastMonth
        ? `▲ improved vs ${avgReachLastMonth.toFixed(1)} last month`
        : avgReachThisMonth > avgReachLastMonth
          ? `▼ up vs ${avgReachLastMonth.toFixed(1)} last month`
          : "same as last month"
      : "not enough data yet";

  const newestFirst = [...logs].reverse();

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <a
          href="/api/export"
          className="rounded-full border border-teal px-3 py-1.5 text-xs font-medium text-teal-deep hover:bg-teal-mist"
        >
          Download CSV
        </a>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Current streak" value={`${streak}d`} />
        <StatCard label="Pain-free days" value={`${painFree}%`} />
        <StatCard
          label="Avg reach this month"
          value={avgReachThisMonth !== null ? avgReachThisMonth.toFixed(1) : "—"}
          sub={reachTrendSub}
        />
        <StatCard label="Checklist completion" value={`${completion}%`} />
      </div>

      <div className="flex gap-1 self-start rounded-full bg-teal-mist p-1">
        {(["30", "90", "all"] as RangeChoice[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              range === r ? "bg-teal text-white" : "text-teal-deep"
            }`}
          >
            {r === "all" ? "All time" : `${r} days`}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-2 rounded-card border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Pain intensity (0–10)</h2>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="painFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8684A" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E8684A" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8E2DD" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#5A6B64" }}
                axisLine={{ stroke: "#D8E2DD" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: "#5A6B64" }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                content={<ChartTooltip unitLabel={(v) => `Pain: ${v}/10`} />}
              />
              <Area
                type="monotone"
                dataKey="pain"
                stroke="#E8684A"
                strokeWidth={2}
                fill="url(#painFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-card border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Pain reach (0 none – 5 foot)</h2>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E7C66" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0E7C66" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8E2DD" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#5A6B64" }}
                axisLine={{ stroke: "#D8E2DD" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 11, fill: "#5A6B64" }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                content={<ChartTooltip unitLabel={(v) => reachLabel(v)} />}
              />
              <Area
                type="monotone"
                dataKey="reach"
                stroke="#0E7C66"
                strokeWidth={2}
                fill="url(#reachFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">All entries</h2>
        <div className="overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Pain</th>
                <th className="px-3 py-2">Reach</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {newestFirst.map((log) => (
                <tr key={log.date} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{log.date}</td>
                  <td className="px-3 py-2">{log.pain}</td>
                  <td className="px-3 py-2">{reachLabel(log.reach)}</td>
                  <td className="px-3 py-2 text-muted">{log.note}</td>
                </tr>
              ))}
              {newestFirst.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted" colSpan={4}>
                    No entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
