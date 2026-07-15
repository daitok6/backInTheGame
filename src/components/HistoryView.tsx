"use client";

import { useState } from "react";
import { RecoveryHistoryView } from "./RecoveryHistoryView";
import { WorkoutsHistoryView } from "./WorkoutsHistoryView";
import type { LogRow } from "@/lib/stats";
import type { SessionSummary } from "@/app/workout-actions";

type ViewChoice = "workouts" | "recovery";

interface HistoryViewProps {
  logs: LogRow[]; // ascending by date
  today: string;
  exercises: { id: number; name: string }[];
  sessions: SessionSummary[];
  weightUnit: string;
}

export function HistoryView({ logs, today, exercises, sessions, weightUnit }: HistoryViewProps) {
  const [view, setView] = useState<ViewChoice>("workouts");

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        {view === "recovery" && (
          <a
            href="/api/export"
            className="rounded-full border border-teal px-4 py-2 text-sm font-medium text-teal-deep hover:bg-teal-mist"
          >
            Download CSV
          </a>
        )}
      </header>

      <div className="flex gap-1 self-start rounded-full bg-teal-mist p-1">
        {(["workouts", "recovery"] as ViewChoice[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              view === v ? "bg-teal text-white" : "text-teal-deep"
            }`}
          >
            {v === "workouts" ? "Workouts" : "Recovery"}
          </button>
        ))}
      </div>

      {view === "workouts" ? (
        <WorkoutsHistoryView exercises={exercises} sessions={sessions} weightUnit={weightUnit} />
      ) : (
        <RecoveryHistoryView logs={logs} today={today} />
      )}
    </main>
  );
}
