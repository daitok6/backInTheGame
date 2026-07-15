"use client";

import { useState } from "react";
import { ExercisePicker, type ExerciseOption } from "./ExercisePicker";
import {
  addRoutineExercise,
  createRoutine,
  deleteRoutine,
  reorderRoutineExercises,
  removeRoutineExercise,
  renameRoutine,
  type RoutineView,
} from "@/app/routine-actions";

interface RoutineManagerProps {
  initialRoutines: RoutineView[];
  initialExercises: ExerciseOption[];
  weightUnit: string;
}

export function RoutineManager({
  initialRoutines,
  initialExercises,
  weightUnit,
}: RoutineManagerProps) {
  const [routines, setRoutines] = useState<RoutineView[]>(initialRoutines);
  const [exercisesList, setExercisesList] = useState<ExerciseOption[]>(initialExercises);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const row = await createRoutine({ name });
      setRoutines((prev) => [...prev, { id: row.id, name: row.name, note: "", exercises: [] }]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    await deleteRoutine({ id });
  }

  async function handleRename(id: number, name: string) {
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
    await renameRoutine({ id, name });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 rounded-card border border-border bg-card p-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New routine name (e.g. Push Day)"
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

      {routines.length === 0 && (
        <p className="text-sm text-muted">No routines yet — create one above.</p>
      )}

      {routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          exercisesList={exercisesList}
          weightUnit={weightUnit}
          onExerciseCreated={(ex) => setExercisesList((prev) => [...prev, ex])}
          onRename={(name) => handleRename(routine.id, name)}
          onDelete={() => handleDelete(routine.id)}
          onSlotAdded={(slot) =>
            setRoutines((prev) =>
              prev.map((r) =>
                r.id === routine.id ? { ...r, exercises: [...r.exercises, slot] } : r,
              ),
            )
          }
          onSlotRemoved={(slotId) =>
            setRoutines((prev) =>
              prev.map((r) =>
                r.id === routine.id
                  ? { ...r, exercises: r.exercises.filter((s) => s.id !== slotId) }
                  : r,
              ),
            )
          }
          onReorder={(reordered) =>
            setRoutines((prev) =>
              prev.map((r) => (r.id === routine.id ? { ...r, exercises: reordered } : r)),
            )
          }
        />
      ))}
    </div>
  );
}

function RoutineCard({
  routine,
  exercisesList,
  weightUnit,
  onExerciseCreated,
  onRename,
  onDelete,
  onSlotAdded,
  onSlotRemoved,
  onReorder,
}: {
  routine: RoutineView;
  exercisesList: ExerciseOption[];
  weightUnit: string;
  onExerciseCreated: (ex: ExerciseOption) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSlotAdded: (slot: RoutineView["exercises"][number]) => void;
  onSlotRemoved: (slotId: number) => void;
  onReorder: (reordered: RoutineView["exercises"]) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(routine.name);
  const [pickerExerciseId, setPickerExerciseId] = useState<number | null>(
    exercisesList[0]?.id ?? null,
  );
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("8");
  const [targetWeight, setTargetWeight] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddSlot() {
    if (!pickerExerciseId) return;
    setAdding(true);
    try {
      const row = await addRoutineExercise({
        routineId: routine.id,
        exerciseId: pickerExerciseId,
        targetSets: targetSets === "" ? undefined : Number(targetSets),
        targetReps: targetReps === "" ? undefined : Number(targetReps),
        targetWeight: targetWeight === "" ? undefined : Number(targetWeight),
      });
      const exerciseName =
        exercisesList.find((e) => e.id === pickerExerciseId)?.name ?? "Unknown";
      onSlotAdded({
        id: row.id,
        exerciseId: row.exerciseId,
        exerciseName,
        orderIndex: row.orderIndex,
        targetSets: row.targetSets,
        targetReps: row.targetReps,
        targetWeight: row.targetWeight,
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveSlot(slotId: number) {
    onSlotRemoved(slotId);
    await removeRoutineExercise({ id: slotId });
  }

  async function handleMoveSlot(index: number, direction: -1 | 1) {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= routine.exercises.length) return;
    const reordered = [...routine.exercises];
    [reordered[index], reordered[otherIndex]] = [reordered[otherIndex], reordered[index]];
    onReorder(reordered);
    await reorderRoutineExercises({
      routineId: routine.id,
      orderedIds: reordered.map((s) => s.id),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        {editingName ? (
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-white px-2 py-1 text-sm outline-none focus:border-teal"
            />
            <button
              type="button"
              onClick={() => {
                onRename(name.trim() || routine.name);
                setEditingName(false);
              }}
              className="text-xs font-medium text-teal-deep"
            >
              Save
            </button>
          </div>
        ) : (
          <h3 className="text-base font-semibold">{routine.name}</h3>
        )}
        <div className="flex shrink-0 gap-2">
          {!editingName && (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-xs text-teal-deep"
            >
              Rename
            </button>
          )}
          <button type="button" onClick={onDelete} className="text-xs text-coral">
            Delete
          </button>
        </div>
      </div>

      {routine.exercises.length === 0 ? (
        <p className="text-sm text-muted">No exercises yet — add one below.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {routine.exercises.map((slot, index) => (
            <li key={slot.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleMoveSlot(index, -1)}
                  disabled={index === 0}
                  className="leading-none text-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSlot(index, 1)}
                  disabled={index === routine.exercises.length - 1}
                  className="leading-none text-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </span>
              <span className="flex-1">
                {slot.exerciseName}
                {slot.targetSets != null && (
                  <span className="text-muted">
                    {" "}
                    — {slot.targetSets}×{slot.targetReps ?? "?"}
                    {slot.targetWeight != null ? ` @ ${slot.targetWeight}${weightUnit}` : ""}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSlot(slot.id)}
                className="text-xs text-coral"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <ExercisePicker
          exercises={exercisesList}
          selectedId={pickerExerciseId}
          onSelect={setPickerExerciseId}
          onCreated={onExerciseCreated}
        />
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Sets</label>
            <input
              type="number"
              value={targetSets}
              onChange={(e) => setTargetSets(e.target.value)}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Reps</label>
            <input
              type="number"
              value={targetReps}
              onChange={(e) => setTargetReps(e.target.value)}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Weight ({weightUnit})</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="optional"
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddSlot}
          disabled={adding || !pickerExerciseId}
          className="w-full rounded-lg border border-teal px-3 py-1.5 text-sm font-medium text-teal-deep hover:bg-teal-mist disabled:opacity-50"
        >
          + Add exercise to routine
        </button>
      </div>
    </div>
  );
}
