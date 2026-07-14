"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Generic debounced-autosave hook. Call `trigger(value)` on every change;
 * the underlying `save` fn fires `delayMs` after the last call, coalescing
 * rapid updates (slider drags, keystrokes) into one request.
 */
export function useDebouncedSave<T>(
  save: (value: T) => Promise<unknown>,
  delayMs = 600,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<T | null>(null);
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, []);

  const trigger = useCallback(
    (value: T) => {
      latest.current = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        setStatus("saving");
        try {
          await save(latest.current as T);
          setStatus("saved");
          if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
          savedResetTimer.current = setTimeout(
            () => setStatus((s) => (s === "saved" ? "idle" : s)),
            1500,
          );
        } catch {
          setStatus("error");
        }
      }, delayMs);
    },
    [save, delayMs],
  );

  /** Fire immediately, skipping the debounce window (e.g. for toggles). */
  const triggerNow = useCallback(
    async (value: T) => {
      if (timer.current) clearTimeout(timer.current);
      latest.current = value;
      setStatus("saving");
      try {
        await save(value);
        setStatus("saved");
        if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
        savedResetTimer.current = setTimeout(
          () => setStatus((s) => (s === "saved" ? "idle" : s)),
          1500,
        );
      } catch {
        setStatus("error");
      }
    },
    [save],
  );

  return { trigger, triggerNow, status };
}
