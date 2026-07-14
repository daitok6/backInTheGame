"use client";

import { useState } from "react";
import { createExercise } from "@/app/workout-actions";

export interface ExerciseOption {
  id: number;
  name: string;
}

interface ExercisePickerProps {
  exercises: ExerciseOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreated: (exercise: ExerciseOption) => void;
}

export function ExercisePicker({
  exercises,
  selectedId,
  onSelect,
  onCreated,
}: ExercisePickerProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const row = await createExercise({ name });
      onCreated({ id: row.id, name: row.name });
      onSelect(row.id);
      setNewName("");
      setAdding(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-muted">
        Exercise
      </label>
      <div className="flex gap-2">
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
        >
          <option value="" disabled>
            Select an exercise…
          </option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="shrink-0 rounded-lg border border-teal px-3 py-2 text-sm font-medium text-teal-deep hover:bg-teal-mist"
        >
          {adding ? "Cancel" : "+ New"}
        </button>
      </div>
      {adding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Exercise name"
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="shrink-0 rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
