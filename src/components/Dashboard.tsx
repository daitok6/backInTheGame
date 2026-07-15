"use client";

import { useState } from "react";
import { PhaseHeader } from "./PhaseHeader";
import { LegMap } from "./LegMap";
import { IntensitySlider } from "./IntensitySlider";
import { NoteField } from "./NoteField";
import { CentralizationStrip } from "./CentralizationStrip";
import { Checklist } from "./Checklist";
import { TodoList, type TodoItemView } from "./TodoList";
import { RedFlagsFooter } from "./RedFlagsFooter";
import { EnableReminders } from "./EnableReminders";
import { upsertDailyLog, toggleTodo, updateSettings } from "@/app/actions";
import { computeDefaultPhase } from "@/lib/date";
import { checklistForPhase, TODOS_BY_PHASE, type Phase } from "@/lib/content";
import type { DaySlot } from "@/lib/centralization";

export interface TodoRow {
  phase: Phase;
  itemId: string;
  done: boolean;
}

export interface DashboardProps {
  today: string;
  flightDate: string;
  todayLog: {
    pain: number;
    reach: number;
    note: string;
    checks: Record<string, boolean>;
  } | null;
  todos: TodoRow[];
  recentDays: DaySlot[]; // last 14 calendar days, oldest first, last entry is today
}

type CheckinSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function Dashboard({
  today,
  flightDate: initialFlightDate,
  todayLog,
  todos,
  recentDays,
}: DashboardProps) {
  const [flightDate, setFlightDate] = useState(initialFlightDate);
  const [phase, setPhase] = useState<Phase>(() =>
    computeDefaultPhase(today, initialFlightDate),
  );

  const [pain, setPain] = useState(todayLog?.pain ?? 0);
  const [reach, setReach] = useState(todayLog?.reach ?? 0);
  const [note, setNote] = useState(todayLog?.note ?? "");
  const [checks, setChecks] = useState<Record<string, boolean>>(
    todayLog?.checks ?? {},
  );
  const [todoState, setTodoState] = useState<TodoRow[]>(todos);

  // Pain, reach, note, and checklist are all fields on today's single
  // daily_logs row — they're edited freely as local state and only written
  // to the server when the user taps "Save check-in" below.
  const [checkinSaveState, setCheckinSaveState] = useState<CheckinSaveState>("idle");

  function handlePainChange(value: number) {
    setPain(value);
    setCheckinSaveState("dirty");
  }

  function handleReachChange(value: number) {
    setReach(value);
    setCheckinSaveState("dirty");
  }

  function handleNoteChange(value: string) {
    setNote(value);
    setCheckinSaveState("dirty");
  }

  function handleChecklistToggle(itemId: string, done: boolean) {
    setChecks((prev) => ({ ...prev, [itemId]: done }));
    setCheckinSaveState("dirty");
  }

  async function handleSaveCheckin() {
    setCheckinSaveState("saving");
    try {
      await upsertDailyLog({ date: today, pain, reach, note, checks });
      setCheckinSaveState("saved");
      setTimeout(() => setCheckinSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch {
      setCheckinSaveState("error");
    }
  }

  // Todo checkboxes stay instant-toggle — plain booleans with nothing to
  // lose mid-edit, unlike the typed/slider fields above.
  async function handleTodoToggle(itemId: string, done: boolean) {
    setTodoState((prev) =>
      prev.map((t) => (t.phase === phase && t.itemId === itemId ? { ...t, done } : t)),
    );
    await toggleTodo({ phase, itemId, done });
  }

  async function handleFlightDateChange(newDate: string) {
    setFlightDate(newDate);
    await updateSettings({ flightDate: newDate });
  }

  const checklistItems = checklistForPhase(phase);
  const phaseTodos: TodoItemView[] = todoState
    .filter((t) => t.phase === phase)
    .map((t) => ({
      itemId: t.itemId,
      label:
        TODOS_BY_PHASE[phase].find((td) => td.itemId === t.itemId)?.label ?? t.itemId,
      done: t.done,
    }));

  // Overlay today's live reach onto the trailing 14-day window (last entry)
  // so the strip and verdict react immediately as the leg map is tapped,
  // even before the check-in is saved.
  const days: DaySlot[] = recentDays.map((d, i) =>
    i === recentDays.length - 1 ? { ...d, reach } : d,
  );

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <PhaseHeader
        today={today}
        flightDate={flightDate}
        phase={phase}
        onPhaseChange={setPhase}
        onFlightDateChange={handleFlightDateChange}
      />

      <EnableReminders />

      <section className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Today&apos;s check-in</h2>
        <LegMap reach={reach} onChange={handleReachChange} />
        <IntensitySlider pain={pain} onChange={handlePainChange} />
        <NoteField note={note} onChange={handleNoteChange} />
        {checklistItems.length > 0 && (
          <Checklist items={checklistItems} checks={checks} onToggle={handleChecklistToggle} />
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs text-muted">
            {checkinSaveState === "dirty" && "Unsaved changes"}
            {checkinSaveState === "saved" && "Saved ✓"}
            {checkinSaveState === "error" && "Couldn't save — try again"}
          </span>
          <button
            type="button"
            onClick={handleSaveCheckin}
            disabled={checkinSaveState === "idle" || checkinSaveState === "saving"}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              checkinSaveState === "error" ? "bg-coral hover:bg-coral" : "bg-teal hover:bg-teal-deep"
            }`}
          >
            {checkinSaveState === "saving" ? "Saving…" : "Save check-in"}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <h2 className="text-base font-semibold">14-day trend</h2>
        <CentralizationStrip days={days} />
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <TodoList items={phaseTodos} onToggle={handleTodoToggle} />
      </section>

      <RedFlagsFooter />
    </main>
  );
}
