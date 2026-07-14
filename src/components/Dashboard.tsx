"use client";

import { useState } from "react";
import { PhaseHeader } from "./PhaseHeader";
import { LegMap } from "./LegMap";
import { IntensitySlider } from "./IntensitySlider";
import { NoteField } from "./NoteField";
import { SaveIndicator } from "./SaveIndicator";
import { CentralizationStrip } from "./CentralizationStrip";
import { Checklist } from "./Checklist";
import { TodoList, type TodoItemView } from "./TodoList";
import { RedFlagsFooter } from "./RedFlagsFooter";
import { EnableReminders } from "./EnableReminders";
import { useDebouncedSave, type SaveStatus } from "@/lib/useDebouncedSave";
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

function combineStatus(statuses: SaveStatus[]): SaveStatus {
  if (statuses.includes("saving")) return "saving";
  if (statuses.includes("error")) return "error";
  if (statuses.includes("saved")) return "saved";
  return "idle";
}

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

  const painSave = useDebouncedSave<number>((value) =>
    upsertDailyLog({ date: today, pain: value }),
  );
  const reachSave = useDebouncedSave<number>((value) =>
    upsertDailyLog({ date: today, reach: value }),
  );
  const noteSave = useDebouncedSave<string>((value) =>
    upsertDailyLog({ date: today, note: value }),
  );
  const checklistSave = useDebouncedSave<Record<string, boolean>>(
    (value) => upsertDailyLog({ date: today, checks: value }),
    300,
  );

  function handlePainChange(value: number) {
    setPain(value);
    painSave.trigger(value);
  }

  function handleReachChange(value: number) {
    setReach(value);
    reachSave.trigger(value);
  }

  function handleNoteChange(value: string) {
    setNote(value);
    noteSave.trigger(value);
  }

  function handleChecklistToggle(itemId: string, done: boolean) {
    setChecks((prev) => {
      const next = { ...prev, [itemId]: done };
      // Send the full local checks object each time; the debounce coalesces
      // rapid toggles and the server merges it, so intermediate states
      // dropped by debouncing are never lost — only ever caught up.
      checklistSave.trigger(next);
      return next;
    });
  }

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
  // so the strip and verdict react immediately as the leg map is tapped.
  const days: DaySlot[] = recentDays.map((d, i) =>
    i === recentDays.length - 1 ? { ...d, reach } : d,
  );

  const overallStatus = combineStatus([
    painSave.status,
    reachSave.status,
    noteSave.status,
    checklistSave.status,
  ]);

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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Today&apos;s check-in</h2>
          <SaveIndicator status={overallStatus} />
        </div>
        <LegMap reach={reach} onChange={handleReachChange} />
        <IntensitySlider pain={pain} onChange={handlePainChange} />
        <NoteField note={note} onChange={handleNoteChange} />
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <h2 className="text-base font-semibold">14-day trend</h2>
        <CentralizationStrip days={days} />
      </section>

      {checklistItems.length > 0 && (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
          <Checklist items={checklistItems} checks={checks} onToggle={handleChecklistToggle} />
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <TodoList items={phaseTodos} onToggle={handleTodoToggle} />
      </section>

      <RedFlagsFooter />
    </main>
  );
}
