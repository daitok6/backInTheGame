import { ExerciseProgressChart } from "./ExerciseProgressChart";
import type { SessionSummary } from "@/app/workout-actions";

interface WorkoutsHistoryViewProps {
  exercises: { id: number; name: string }[];
  sessions: SessionSummary[];
  weightUnit: string;
}

export function WorkoutsHistoryView({
  exercises,
  sessions,
  weightUnit,
}: WorkoutsHistoryViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-card border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Progress</h2>
        <ExerciseProgressChart exercises={exercises} weightUnit={weightUnit} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Sessions</h2>
        <div className="overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Exercises</th>
                <th className="px-3 py-2">Sets</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{session.date}</td>
                  <td className="px-3 py-2 text-muted">{session.label || "—"}</td>
                  <td className="px-3 py-2 text-muted">{session.exerciseNames.join(", ")}</td>
                  <td className="px-3 py-2">{session.setCount}</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted" colSpan={4}>
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
