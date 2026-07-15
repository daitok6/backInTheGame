"use client";

import { useState } from "react";
import { PHASE_LABELS, type Phase } from "@/lib/content";
import { daysUntilFlight } from "@/lib/date";

interface PhaseHeaderProps {
  today: string;
  flightDate: string;
  phase: Phase;
  onPhaseChange: (phase: Phase) => void;
  onFlightDateChange: (date: string) => void;
}

const PHASE_ORDER: Phase[] = ["pre", "flight", "kl"];

export function PhaseHeader({
  today,
  flightDate,
  phase,
  onPhaseChange,
  onFlightDateChange,
}: PhaseHeaderProps) {
  const [editingDate, setEditingDate] = useState(false);
  const [draftDate, setDraftDate] = useState(flightDate);
  const diff = daysUntilFlight(today, flightDate);

  const countdownText =
    diff > 0
      ? `${diff} day${diff === 1 ? "" : "s"} until flight`
      : diff === 0
        ? "Flight day"
        : `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} since flight`;

  function startEditing() {
    setDraftDate(flightDate);
    setEditingDate(true);
  }

  function handleSave() {
    if (draftDate) onFlightDateChange(draftDate);
    setEditingDate(false);
  }

  function handleCancel() {
    setDraftDate(flightDate);
    setEditingDate(false);
  }

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-lg text-white">
          ↑
        </div>
        <h1 className="text-xl font-semibold">Back in the Game</h1>
      </div>

      {editingDate ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            autoFocus
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal-deep"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-teal-mist"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="w-fit text-left text-sm text-muted underline decoration-dotted underline-offset-4"
        >
          {countdownText} · flight {flightDate}
        </button>
      )}

      <div className="flex gap-1 rounded-full bg-teal-mist p-1">
        {PHASE_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPhaseChange(p)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              phase === p ? "bg-teal text-white" : "text-teal-deep"
            }`}
          >
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>
    </header>
  );
}
