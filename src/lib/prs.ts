export interface SetForPr {
  weight: number;
  reps: number;
}

export interface ExercisePrs {
  heaviestWeight: number;
  heaviestWeightReps: number;
  bestEstimated1Rm: number;
  mostReps: number;
  mostRepsWeight: number;
  bestSetVolume: number;
}

/** Epley formula: a standard estimated one-rep-max from a single set. */
export function estimated1Rm(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/** Computes the current personal-record bests for one exercise from every
 * set ever logged against it. Pure aggregation — callers decide what counts
 * as "prior" vs. "new" by slicing the input before/after a given set. */
export function computePrs(sets: SetForPr[]): ExercisePrs | null {
  if (sets.length === 0) return null;

  let heaviestWeight = -Infinity;
  let heaviestWeightReps = 0;
  let bestEstimated1Rm = -Infinity;
  let mostReps = -Infinity;
  let mostRepsWeight = 0;
  let bestSetVolume = -Infinity;

  for (const s of sets) {
    if (s.weight > heaviestWeight) {
      heaviestWeight = s.weight;
      heaviestWeightReps = s.reps;
    }
    const oneRm = estimated1Rm(s.weight, s.reps);
    if (oneRm > bestEstimated1Rm) bestEstimated1Rm = oneRm;
    if (s.reps > mostReps) {
      mostReps = s.reps;
      mostRepsWeight = s.weight;
    }
    const volume = s.weight * s.reps;
    if (volume > bestSetVolume) bestSetVolume = volume;
  }

  return {
    heaviestWeight,
    heaviestWeightReps,
    bestEstimated1Rm,
    mostReps,
    mostRepsWeight,
    bestSetVolume,
  };
}

export interface PrHit {
  heaviestWeight: boolean;
  bestEstimated1Rm: boolean;
  mostReps: boolean;
  bestSetVolume: boolean;
}

/** Whether `candidate`, appended after `priorSets`, sets a new PR in any
 * category. Used right after logging a set to decide whether to celebrate. */
export function checkNewPr(priorSets: SetForPr[], candidate: SetForPr): PrHit {
  const before = computePrs(priorSets);
  const candidateOneRm = estimated1Rm(candidate.weight, candidate.reps);
  const candidateVolume = candidate.weight * candidate.reps;

  if (!before) {
    return {
      heaviestWeight: true,
      bestEstimated1Rm: true,
      mostReps: true,
      bestSetVolume: true,
    };
  }

  return {
    heaviestWeight: candidate.weight > before.heaviestWeight,
    bestEstimated1Rm: candidateOneRm > before.bestEstimated1Rm,
    mostReps: candidate.reps > before.mostReps,
    bestSetVolume: candidateVolume > before.bestSetVolume,
  };
}

/** True if any category in a PrHit is set — convenience for UI branching. */
export function isAnyPr(hit: PrHit): boolean {
  return hit.heaviestWeight || hit.bestEstimated1Rm || hit.mostReps || hit.bestSetVolume;
}
