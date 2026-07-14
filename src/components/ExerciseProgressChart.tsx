"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getExerciseHistory } from "@/app/workout-actions";
import { topWeightBySessionDate } from "@/lib/workoutStats";

interface ExerciseProgressChartProps {
  exercises: { id: number; name: string }[];
  weightUnit: string;
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

function ProgressTooltip({
  active,
  payload,
  label,
  weightUnit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  weightUnit: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-ink">{label}</div>
      <div className="text-muted">
        Top set: {payload[0].value}
        {weightUnit}
      </div>
    </div>
  );
}

export function ExerciseProgressChart({ exercises, weightUnit }: ExerciseProgressChartProps) {
  const [exerciseId, setExerciseId] = useState<number | null>(exercises[0]?.id ?? null);
  const [points, setPoints] = useState<{ date: string; topWeight: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    setLoading(true);
    getExerciseHistory(exerciseId)
      .then((sets) => {
        if (!cancelled) setPoints(topWeightBySessionDate(sets));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  const chartData = points.map((p) => ({ date: formatShortDate(p.date), topWeight: p.topWeight }));

  if (exercises.length === 0) {
    return <p className="text-sm text-muted">No exercises yet — log a set on the Workouts page first.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={exerciseId ?? ""}
        onChange={(e) => setExerciseId(Number(e.target.value))}
        className="w-fit rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      <div className="h-40 w-full">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted">No sets logged for this exercise yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
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
                tick={{ fontSize: 11, fill: "#5A6B64" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ProgressTooltip weightUnit={weightUnit} />} />
              <Area
                type="monotone"
                dataKey="topWeight"
                stroke="#0E7C66"
                strokeWidth={2}
                fill="url(#progressFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
