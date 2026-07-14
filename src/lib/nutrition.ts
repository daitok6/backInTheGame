export interface NutritionEntryTotals {
  servings: number;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
}

export interface DayTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Sums calories/macros across a day's entries, scaling each by its
 * servings count. Null macros (carbs/fat aren't always tracked) contribute
 * 0 rather than propagating null through the sum. */
export function dayTotals(entries: NutritionEntryTotals[]): DayTotals {
  return entries.reduce<DayTotals>(
    (totals, e) => ({
      calories: totals.calories + e.caloriesPerServing * e.servings,
      proteinG: totals.proteinG + e.proteinG * e.servings,
      carbsG: totals.carbsG + (e.carbsG ?? 0) * e.servings,
      fatG: totals.fatG + (e.fatG ?? 0) * e.servings,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

/** Fraction of a target reached, clamped to [0, 1] for progress-bar use.
 * Returns 0 when there's no target set (avoids divide-by-zero/Infinity). */
export function progressFraction(current: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(1, current / target));
}
