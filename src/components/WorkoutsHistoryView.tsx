"use client";

import { useState } from "react";
import { ExerciseProgressChart } from "./ExerciseProgressChart";
import { updateSessionLabel, type SessionSummary } from "@/app/workout-actions";

interface WorkoutsHistoryViewProps {
  exercises: { id: number; name: string }[];
  sessions: SessionSummary[];
  weightUnit: string;
}

export function WorkoutsHistoryView({
  exercises,
  sessions: initialSessions,
  weightUnit,
}: WorkoutsHistoryViewProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>(initialSessions);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(session: SessionSummary) {
    setEditingId(session.id);
    setEditLabel(session.label);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (editingId === null) return;
    setSaving(true);
    try {
      await updateSessionLabel({ id: editingId, label: editLabel });
      setSessions((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, label: editLabel } : s)),
      );
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-card border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Progress</h2>
        <ExerciseProgressChart exercises={exercises} weightUnit={weightUnit} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Sessions</h2>
        <div className="overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Exercises</th>
                <th className="px-3 py-2">Sets</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) =>
                editingId === session.id ? (
                  <tr key={session.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap align-top">{session.date}</td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Label"
                        className="w-full min-w-[100px] rounded border border-border px-1.5 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 align-top text-muted">
                      {session.exerciseNames.join(", ")}
                    </td>
                    <td className="px-3 py-2 align-top">{session.setCount}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="mr-2 text-xs font-medium text-teal-deep disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button type="button" onClick={cancelEdit} className="text-xs text-muted">
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={session.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{session.date}</td>
                    <td className="px-3 py-2 text-muted">{session.label || "—"}</td>
                    <td className="px-3 py-2 text-muted">{session.exerciseNames.join(", ")}</td>
                    <td className="px-3 py-2">{session.setCount}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => startEdit(session)}
                        className="text-xs font-medium text-teal-deep"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ),
              )}
              {sessions.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted" colSpan={5}>
                    No workout sessions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
