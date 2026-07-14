"use client";

import { useEffect, useRef, useState } from "react";
import { formatMmSs, remainingSeconds } from "@/lib/timer";

interface RestTimerProps {
  /** Bumped by the parent every time a set is logged, to (re)start the timer. */
  triggerKey: number;
  durationSeconds: number;
}

/** A short beep via Web Audio — no audio asset needed. */
function playBeep() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio isn't available (e.g. autoplay policy) — silently skip.
  }
}

/** Sticky rest-timer bar. Auto-starts whenever `triggerKey` changes (i.e.
 * right after a set is logged), counts down from `durationSeconds`, and
 * alerts via vibration + a beep on completion. */
export function RestTimer({ triggerKey, durationSeconds }: RestTimerProps) {
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [duration, setDuration] = useState(durationSeconds);
  const [remaining, setRemaining] = useState(durationSeconds);
  const hasAlertedRef = useRef(false);
  const firstRun = useRef(true);

  // Restart the timer whenever the parent bumps triggerKey.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setStartedAtMs(Date.now());
    setDuration(durationSeconds);
    setRemaining(durationSeconds);
    hasAlertedRef.current = false;
    // durationSeconds intentionally excluded — a settings change shouldn't
    // itself restart an in-progress timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  useEffect(() => {
    if (startedAtMs === null) return;
    const interval = setInterval(() => {
      const left = remainingSeconds(startedAtMs, duration, Date.now());
      setRemaining(left);
      if (left === 0 && !hasAlertedRef.current) {
        hasAlertedRef.current = true;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        playBeep();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [startedAtMs, duration]);

  if (startedAtMs === null || remaining === 0) return null;

  function adjust(deltaSeconds: number) {
    const next = Math.max(remaining + deltaSeconds, 0);
    setStartedAtMs(Date.now());
    setDuration(next);
    setRemaining(next);
  }

  function skip() {
    setStartedAtMs(null);
  }

  const pct = duration > 0 ? Math.round((remaining / duration) * 100) : 0;

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-3 rounded-card border border-teal bg-card px-4 py-3 shadow-sm">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Rest</span>
          <span className="font-mono text-sm font-semibold text-teal-deep">
            {formatMmSs(remaining)}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-teal-mist">
          <div
            className="h-full rounded-full bg-teal transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => adjust(-15)}
        className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium text-ink hover:bg-teal-mist"
      >
        −15s
      </button>
      <button
        type="button"
        onClick={() => adjust(15)}
        className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium text-ink hover:bg-teal-mist"
      >
        +15s
      </button>
      <button
        type="button"
        onClick={skip}
        className="shrink-0 rounded-lg bg-coral-soft px-2 py-1 text-xs font-medium text-coral hover:opacity-80"
      >
        Skip
      </button>
    </div>
  );
}
