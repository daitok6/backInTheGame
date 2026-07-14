"use client";

import { useEffect, useRef, useState } from "react";
import { formatMmSs, remainingSeconds } from "@/lib/timer";
import { logGuidedAsSession, type GuidedWorkoutView } from "@/app/guided-actions";

interface GuidedPlayerProps {
  workout: GuidedWorkoutView;
  today: string;
  onExit: () => void;
}

/** Full-screen step player. Time-based steps auto-advance when their
 * countdown hits 0; rep-based (or step-less) steps wait for a manual tap. */
export function GuidedPlayer({ workout, today, onExit }: GuidedPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState(Date.now());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const hasAdvancedRef = useRef(false);

  const step = workout.steps[stepIndex];
  const nextStep = workout.steps[stepIndex + 1];

  useEffect(() => {
    setStartedAtMs(Date.now());
    hasAdvancedRef.current = false;
    setPaused(false);
    setPausedRemaining(null);
  }, [stepIndex]);

  useEffect(() => {
    if (!step?.durationSeconds || paused) return;
    const interval = setInterval(() => {
      const left = remainingSeconds(startedAtMs, step.durationSeconds!, Date.now());
      setRemaining(left);
      if (left === 0 && !hasAdvancedRef.current) {
        hasAdvancedRef.current = true;
        if (navigator.vibrate) navigator.vibrate(200);
        advance();
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAtMs, paused, stepIndex]);

  function togglePause() {
    if (!step?.durationSeconds) return;
    if (paused) {
      const resumeFrom = pausedRemaining ?? step.durationSeconds;
      setStartedAtMs(Date.now() - (step.durationSeconds - resumeFrom) * 1000);
      setPaused(false);
    } else {
      setPausedRemaining(remainingSeconds(startedAtMs, step.durationSeconds, Date.now()));
      setPaused(true);
    }
  }

  function advance() {
    if (stepIndex + 1 >= workout.steps.length) {
      setFinished(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  async function handleLog() {
    setLogging(true);
    try {
      await logGuidedAsSession({ workoutId: workout.id, date: today });
      setLogged(true);
    } finally {
      setLogging(false);
    }
  }

  if (workout.steps.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
        <p className="text-sm text-muted">This workout has no steps yet.</p>
        <button
          type="button"
          onClick={onExit}
          className="w-fit rounded-lg border border-border px-3 py-1.5 text-sm text-ink hover:bg-teal-mist"
        >
          Back
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-teal bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Workout complete! 🎉</h2>
        <p className="text-sm text-muted">{workout.name}</p>
        {logged ? (
          <p className="text-sm font-medium text-teal-deep">Logged to your history.</p>
        ) : (
          <button
            type="button"
            onClick={handleLog}
            disabled={logging}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-50"
          >
            {logging ? "Logging…" : "Log this workout"}
          </button>
        )}
        <button type="button" onClick={onExit} className="text-xs text-muted underline">
          Back to guided workouts
        </button>
      </div>
    );
  }

  const displayRemaining = step.durationSeconds
    ? (paused ? pausedRemaining : remaining) ?? step.durationSeconds
    : null;

  return (
    <div className="flex flex-col items-center gap-6 rounded-card border border-teal bg-card p-8 text-center">
      <span className="text-xs uppercase tracking-wide text-muted">
        Step {stepIndex + 1} of {workout.steps.length}
      </span>
      <h2 className="text-2xl font-semibold">{step.name}</h2>

      {displayRemaining !== null ? (
        <span className="font-mono text-4xl font-bold text-teal-deep">
          {formatMmSs(displayRemaining)}
        </span>
      ) : step.reps ? (
        <span className="text-4xl font-bold text-teal-deep">{step.reps} reps</span>
      ) : (
        <span className="text-sm text-muted">Tap next when ready</span>
      )}

      {step.videoUrl && (
        <a
          href={step.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-teal-deep underline decoration-teal-mist underline-offset-2 hover:text-teal"
        >
          ▶ watch form
        </a>
      )}

      {nextStep && <p className="text-xs text-muted">Up next: {nextStep.name}</p>}

      <div className="flex gap-2">
        {step.durationSeconds && (
          <button
            type="button"
            onClick={togglePause}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-teal-mist"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        )}
        <button
          type="button"
          onClick={advance}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-deep"
        >
          {stepIndex + 1 >= workout.steps.length ? "Finish" : "Next"}
        </button>
      </div>
      <button type="button" onClick={onExit} className="text-xs text-muted underline">
        Exit
      </button>
    </div>
  );
}
