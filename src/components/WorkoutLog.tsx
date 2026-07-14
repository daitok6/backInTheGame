"use client";

import { useEffect, useMemo, useState } from "react";
import { ExercisePicker, type ExerciseOption } from "./ExercisePicker";
import {
  getWorkoutDay,
  logSet,
  updateSet,
  deleteSet,
  type WorkoutSetView,
} from "@/app/workout-actions";

interface WorkoutLogProps {
  today: string;
  initialExercises: ExerciseOption[];
  initialSets: WorkoutSetView[];
  weightUnit: string;
}

export function WorkoutLog({
  today,
  initialExercises,
  initialSets,
  weightUnit,
}: WorkoutLogProps) {
  const [date, setDate] = useState(today);
  const [exercisesList, setExercisesList] = useState<ExerciseOption[]>(initialExercises);
  const [sets, setSets] = useState<WorkoutSetView[]>(initialSets);
  const [loadingSets, setLoadingSets] = useState(false);

  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    initialExercises[0]?.id ?? null,
  );
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (date === today) {
      setSets(initialSets);
      return;
    }
    let cancelled = false;
    setLoadingSets(true);
    getWorkoutDay(date)
      .then((result) => {
        if (!cancelled) setSets(result);
      })
      .finally(() => {
        if (!cancelled) setLoadingSets(false);
      });
    return () => {
      cancelled = true;
    };
    // initialSets/today are stable for the lifetime of this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const grouped = useMemo(() => {
    const map = new Map<number, WorkoutSetView[]>();
    for (const s of sets) {
      const arr = map.get(s.exerciseId) ?? [];
      arr.push(s);
      map.set(s.exerciseId, arr);
    }
    return Array.from(map.entries()).map(([exerciseId, exerciseSets]) => ({
      exerciseId,
      exerciseName: exerciseSets[0]?.exerciseName ?? "Unknown",
      sets: exerciseSets,
    }));
  }, [sets]);

  async function handleLogSet() {
    if (!selectedExerciseId || weight === "" || reps === "") return;
    const weightNum = Number(weight);
    const repsNum = Number(reps);
    if (!Number.isFinite(weightNum) || !Number.isFinite(repsNum)) return;

    setLogging(true);
    try {
      const rpeNum = rpe === "" ? undefined : Number(rpe);
      const result = await logSet({
        date,
        exerciseId: selectedExerciseId,
        weight: weightNum,
        reps: repsNum,
        rpe: rpeNum,
      });
      const exerciseName =
        exercisesList.find((e) => e.id === selectedExerciseId)?.name ?? "Unknown";
      setSets((prev) => [
        ...prev,
        {
          id: result.set.id,
          sessionId: result.set.sessionId,
          exerciseId: result.set.exerciseId,
          exerciseName,
          sessionLabel: result.session.label ?? "",
          setOrder: result.set.setOrder,
          weight: result.set.weight,
          reps: result.set.reps,
          rpe: result.set.rpe,
          note: result.set.note ?? "",
        },
      ]);
      // Keep the exercise selected — logging several consecutive sets of
      // the same exercise is the common case.
      setWeight("");
      setReps("");
      setRpe("");
    } finally {
      setLogging(false);
    }
  }

  async function handleDelete(id: number) {
    setSets((prev) => prev.filter((s) => s.id !== id));
    await deleteSet({ id });
  }

  async function handleUpdate(
    id: number,
    patch: { weight?: number; reps?: number; rpe?: number },
  ) {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await updateSet({ id, ...patch });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Log a set</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-white px-2 py-1 text-sm outline-none focus:border-teal"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <ExercisePicker
          exercises={exercisesList}
          selectedId={selectedExerciseId}
          onSelect={setSelectedExerciseId}
          onCreated={(ex) => setExercisesList((prev) => [...prev, ex])}
        />
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Weight ({weightUnit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="rounded-lg border border-border bg-white px-2 py-2 text-sm outline-none focus:border-teal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Reps</label>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="rounded-lg border border-border bg-white px-2 py-2 text-sm outline-none focus:border-teal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">RPE (optional)</label>
            <input
              type="number"
              inputMode="decimal"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="rounded-lg border border-border bg-white px-2 py-2 text-sm outline-none focus:border-teal"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogSet}
          disabled={logging || !selectedExerciseId || reps === "" || weight === ""}
          className="w-full rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {logging ? "Logging…" : "Log set"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          {date === today ? "Today's sets" : `Sets on ${date}`}
        </h2>
        {loadingSets && <p className="text-sm text-muted">Loading…</p>}
        {!loadingSets && grouped.length === 0 && (
          <p className="text-sm text-muted">No sets logged yet.</p>
        )}
        {!loadingSets &&
          grouped.map((group) => (
            <div
              key={group.exerciseId}
              className="flex flex-col gap-2 rounded-card border border-border bg-card p-3"
            >
              <h3 className="text-sm font-semibold">{group.exerciseName}</h3>
              <ul className="flex flex-col gap-1.5">
                {group.sets.map((s, i) => (
                  <SetRow
                    key={s.id}
                    index={i + 1}
                    set={s}
                    weightUnit={weightUnit}
                    onUpdate={(patch) => handleUpdate(s.id, patch)}
                    onDelete={() => handleDelete(s.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

function SetRow({
  index,
  set,
  weightUnit,
  onUpdate,
  onDelete,
}: {
  index: number;
  set: WorkoutSetView;
  weightUnit: string;
  onUpdate: (patch: { weight?: number; reps?: number; rpe?: number }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));
  const [rpe, setRpe] = useState(set.rpe !== null ? String(set.rpe) : "");

  function handleSave() {
    onUpdate({
      weight: Number(weight),
      reps: Number(reps),
      rpe: rpe === "" ? undefined : Number(rpe),
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2">
        <span className="w-5 text-xs text-muted">{index}.</span>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-16 rounded border border-border px-1.5 py-1 text-sm"
        />
        <span className="text-xs text-muted">{weightUnit} ×</span>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-14 rounded border border-border px-1.5 py-1 text-sm"
        />
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          placeholder="RPE"
          className="w-14 rounded border border-border px-1.5 py-1 text-sm"
        />
        <button type="button" onClick={handleSave} className="text-xs font-medium text-teal-deep">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted">
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span>
        <span className="text-muted">{index}.</span> {set.weight}
        {weightUnit} × {set.reps}
        {set.rpe !== null && <span className="text-muted"> @RPE {set.rpe}</span>}
      </span>
      <span className="flex gap-2">
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-teal-deep">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="text-xs text-coral">
          Delete
        </button>
      </span>
    </li>
  );
}
