"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { AnalyticsView } from "@/app/analytics-actions";

interface AnalyticsDashboardProps {
  analytics: AnalyticsView;
  weightUnit: string;
}

const CHART_COLORS = ["#0E7C66", "#0A5A4B", "#E8684A", "#5A6B64", "#8FBFB2", "#F0A98A"];

function formatShortWeek(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

export function AnalyticsDashboard({ analytics, weightUnit }: AnalyticsDashboardProps) {
  const { muscleGroupVolume, weeklyVolume, topExercises, currentMonth, personalRecords } =
    analytics;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Sessions" value={String(currentMonth.sessionCount)} />
        <StatTile label="Sets" value={String(currentMonth.setCount)} />
        <StatTile
          label="Volume"
          value={`${Math.round(currentMonth.totalVolume).toLocaleString()}${weightUnit}`}
        />
      </div>

      <Panel title="Weekly volume">
        {weeklyVolume.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyVolume.map((p) => ({
                  week: formatShortWeek(p.weekStart),
                  volume: p.volume,
                }))}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E7C66" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0E7C66" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8E2DD" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#5A6B64" }}
                  axisLine={{ stroke: "#D8E2DD" }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5A6B64" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(value) => [`${Math.round(Number(value))}${weightUnit}`, "Volume"]}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#D8E2DD",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#0E7C66"
                  strokeWidth={2}
                  fill="url(#volumeFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="Volume by muscle group">
        {muscleGroupVolume.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={muscleGroupVolume}
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D8E2DD" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="muscleGroup"
                  tick={{ fontSize: 11, fill: "#5A6B64" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [`${Math.round(Number(value))}${weightUnit}`, "Volume"]}
                  contentStyle={{ borderRadius: 8, borderColor: "#D8E2DD", fontSize: 12 }}
                />
                <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
                  {muscleGroupVolume.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="Most-trained exercises">
        {topExercises.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {topExercises.map((ex) => (
              <li key={ex.exerciseId} className="flex items-center justify-between text-sm">
                <span>{ex.exerciseName}</span>
                <span className="text-muted">{ex.setCount} sets</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Personal records">
        {personalRecords.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {personalRecords.map((pr) => (
              <li key={pr.exerciseId} className="flex flex-col gap-0.5 text-sm">
                <span className="font-medium">{pr.exerciseName}</span>
                <span className="text-xs text-muted">
                  Best set: {pr.heaviestWeight}
                  {weightUnit} × {pr.heaviestWeightReps} · Est. 1RM:{" "}
                  {Math.round(pr.bestEstimated1Rm)}
                  {weightUnit} · Most reps: {pr.mostReps}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-border bg-card py-3">
      <span className="text-lg font-semibold text-teal-deep">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return <p className="text-sm text-muted">Not enough data yet — log some sets first.</p>;
}
