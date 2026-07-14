"use client";

import type { ChecklistItem } from "@/lib/content";
import { WatchFormLink } from "./WatchFormLink";

interface ChecklistProps {
  items: ChecklistItem[];
  checks: Record<string, boolean>;
  onToggle: (itemId: string, done: boolean) => void;
}

export function Checklist({ items, checks, onToggle }: ChecklistProps) {
  if (items.length === 0) return null;
  const doneCount = items.filter((i) => checks[i.id]).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Today&apos;s checklist</h2>
        <span className="text-sm text-muted">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const checked = !!checks[item.id];
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-card border border-border bg-card p-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(item.id, e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
                aria-label={item.label}
              />
              <div className="flex flex-1 flex-col gap-1">
                <span
                  className={`text-sm font-medium ${checked ? "text-muted line-through" : "text-ink"}`}
                >
                  {item.label}
                </span>
                <span className="text-xs text-muted">{item.hint}</span>
                {item.videoKey && <WatchFormLink videoKey={item.videoKey} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
