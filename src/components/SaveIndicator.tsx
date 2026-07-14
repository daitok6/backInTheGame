"use client";

import type { SaveStatus } from "@/lib/useDebouncedSave";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const text =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Couldn't save";

  const color =
    status === "error" ? "text-coral" : status === "saved" ? "text-teal" : "text-muted";

  return (
    <span className={`text-xs font-medium transition-opacity ${color}`}>{text}</span>
  );
}
