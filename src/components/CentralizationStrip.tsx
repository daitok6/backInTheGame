"use client";

import { computeCentralization, VERDICT_TEXT, type DaySlot } from "@/lib/centralization";

interface CentralizationStripProps {
  days: DaySlot[]; // oldest first, length 14
}

const TRACK_HEIGHT = 56; // fixed-height track each day's bar sits inside
const EMPTY_HEIGHT = 10; // unlogged-day placeholder height
const PAIN_FREE_HEIGHT = 16; // reach === 0
const MIN_CORAL_HEIGHT = 16;

export function CentralizationStrip({ days }: CentralizationStripProps) {
  const result = computeCentralization(days);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-1.5" style={{ height: TRACK_HEIGHT }}>
        {days.map((d) => {
          const label =
            d.reach === null ? "not logged" : `reach ${d.reach} (${d.date})`;

          if (d.reach === null) {
            return (
              <div
                key={d.date}
                title={label}
                className="w-full flex-1 self-end rounded-t-md border border-dashed border-border"
                style={{ height: EMPTY_HEIGHT }}
              />
            );
          }

          if (d.reach === 0) {
            return (
              <div
                key={d.date}
                title={label}
                className="w-full flex-1 self-end rounded-t-md bg-teal"
                style={{ height: PAIN_FREE_HEIGHT }}
              />
            );
          }

          const height =
            MIN_CORAL_HEIGHT + (d.reach / 5) * (TRACK_HEIGHT - MIN_CORAL_HEIGHT);
          const opacity = 0.4 + (d.reach / 5) * 0.6;

          return (
            <div
              key={d.date}
              title={label}
              className="w-full flex-1 self-end rounded-t-md bg-coral"
              style={{ height, opacity }}
            />
          );
        })}
      </div>
      <p className="text-sm font-medium">{VERDICT_TEXT[result.verdict]}</p>
    </div>
  );
}
