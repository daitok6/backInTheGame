"use client";

import { useState } from "react";
import {
  addStep,
  createGuidedWorkout,
  deleteGuidedWorkout,
  removeStep,
  type GuidedWorkoutView,
} from "@/app/guided-actions";

interface GuidedBuilderProps {
  workouts: GuidedWorkoutView[];
  onWorkoutsChange: (updater: (prev: GuidedWorkoutView[]) => GuidedWorkoutView[]) => void;
  onStart: (workoutId: number) => void;
}

export function GuidedBuilder({ workouts, onWorkoutsChange, onStart }: GuidedBuilderProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const row = await createGuidedWorkout({ name });
      onWorkoutsChange((prev) => [...prev, { id: row.id, name: row.name, description: "", steps: [] }]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    onWorkoutsChange((prev) => prev.filter((w) => w.id !== id));
    await deleteGuidedWorkout({ id });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 rounded-card border border-border bg-card p-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New guided workout name"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="shrink-0 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-50"
        >
          Create
        </button>
      </div>

      {workouts.length === 0 && (
        <p className="text-sm text-muted">No guided workouts yet — create one above.</p>
      )}

      {workouts.map((workout) => (
        <GuidedWorkoutCard
          key={workout.id}
          workout={workout}
          onDelete={() => handleDelete(workout.id)}
          onStart={() => onStart(workout.id)}
          onStepAdded={(step) =>
            onWorkoutsChange((prev) =>
              prev.map((w) => (w.id === workout.id ? { ...w, steps: [...w.steps, step] } : w)),
            )
          }
          onStepRemoved={(stepId) =>
            onWorkoutsChange((prev) =>
              prev.map((w) =>
                w.id === workout.id
                  ? { ...w, steps: w.steps.filter((s) => s.id !== stepId) }
                  : w,
              ),
            )
          }
        />
      ))}
    </div>
  );
}

function GuidedWorkoutCard({
  workout,
  onDelete,
  onStart,
  onStepAdded,
  onStepRemoved,
}: {
  workout: GuidedWorkoutView;
  onDelete: () => void;
  onStart: () => void;
  onStepAdded: (step: GuidedWorkoutView["steps"][number]) => void;
  onStepRemoved: (stepId: number) => void;
}) {
  const [stepName, setStepName] = useState("");
  const [stepMode, setStepMode] = useState<"duration" | "reps">("duration");
  const [stepValue, setStepValue] = useState("30");
  const [stepVideoUrl, setStepVideoUrl] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddStep() {
    const name = stepName.trim();
    const value = Number(stepValue);
    if (!name || !Number.isFinite(value) || value <= 0) return;

    setAdding(true);
    try {
      const row = await addStep({
        workoutId: workout.id,
        name,
        durationSeconds: stepMode === "duration" ? value : undefined,
        reps: stepMode === "reps" ? value : undefined,
        videoUrl: stepVideoUrl.trim() || undefined,
      });
      onStepAdded({
        id: row.id,
        orderIndex: row.orderIndex,
        name: row.name,
        durationSeconds: row.durationSeconds,
        reps: row.reps,
        videoUrl: row.videoUrl,
      });
      setStepName("");
      setStepValue("30");
      setStepVideoUrl("");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveStep(stepId: number) {
    onStepRemoved(stepId);
    await removeStep({ id: stepId });
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{workout.name}</h3>
        <div className="flex shrink-0 gap-3">
          {workout.steps.length > 0 && (
            <button type="button" onClick={onStart} className="text-xs font-medium text-teal-deep">
              Start
            </button>
          )}
          <button type="button" onClick={onDelete} className="text-xs text-coral">
            Delete
          </button>
        </div>
      </div>

      {workout.steps.length === 0 ? (
        <p className="text-sm text-muted">No steps yet — add one below.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {workout.steps.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span>
                {i + 1}. {s.name}
                <span className="text-muted">
                  {" — "}
                  {s.durationSeconds ? `${s.durationSeconds}s` : s.reps ? `${s.reps} reps` : "manual"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleRemoveStep(s.id)}
                className="text-xs text-coral"
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <input
          type="text"
          value={stepName}
          onChange={(e) => setStepName(e.target.value)}
          placeholder="Step name (e.g. Jumping jacks)"
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={stepMode}
            onChange={(e) => setStepMode(e.target.value as "duration" | "reps")}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
          >
            <option value="duration">Seconds</option>
            <option value="reps">Reps</option>
          </select>
          <input
            type="number"
            value={stepValue}
            onChange={(e) => setStepValue(e.target.value)}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
          />
          <input
            type="url"
            value={stepVideoUrl}
            onChange={(e) => setStepVideoUrl(e.target.value)}
            placeholder="Video URL (optional)"
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
          />
        </div>
        <button
          type="button"
          onClick={handleAddStep}
          disabled={adding || !stepName.trim()}
          className="w-full rounded-lg border border-teal px-3 py-1.5 text-sm font-medium text-teal-deep hover:bg-teal-mist disabled:opacity-50"
        >
          + Add step
        </button>
      </div>
    </div>
  );
}
