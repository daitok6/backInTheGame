"use client";

import { useState } from "react";
import { GuidedBuilder } from "./GuidedBuilder";
import { GuidedPlayer } from "./GuidedPlayer";
import type { GuidedWorkoutView } from "@/app/guided-actions";

interface GuidedWorkoutsProps {
  initialWorkouts: GuidedWorkoutView[];
  today: string;
}

export function GuidedWorkouts({ initialWorkouts, today }: GuidedWorkoutsProps) {
  const [workouts, setWorkouts] = useState<GuidedWorkoutView[]>(initialWorkouts);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const playing = workouts.find((w) => w.id === playingId) ?? null;

  if (playing) {
    return <GuidedPlayer workout={playing} today={today} onExit={() => setPlayingId(null)} />;
  }

  return (
    <GuidedBuilder workouts={workouts} onWorkoutsChange={setWorkouts} onStart={setPlayingId} />
  );
}
