import { describe, expect, it } from "vitest";
import { dayTotals, progressFraction } from "./nutrition";

describe("dayTotals", () => {
  it("returns zeros for no entries", () => {
    expect(dayTotals([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it("scales by servings and sums across entries", () => {
    const totals = dayTotals([
      { servings: 2, caloriesPerServing: 100, proteinG: 10, carbsG: 5, fatG: 2 },
      { servings: 1, caloriesPerServing: 300, proteinG: 20, carbsG: null, fatG: null },
    ]);
    expect(totals).toEqual({ calories: 500, proteinG: 40, carbsG: 10, fatG: 4 });
  });

  it("treats null carbs/fat as 0 rather than propagating null", () => {
    const totals = dayTotals([
      { servings: 1, caloriesPerServing: 100, proteinG: 5, carbsG: null, fatG: null },
    ]);
    expect(totals.carbsG).toBe(0);
    expect(totals.fatG).toBe(0);
  });
});

describe("progressFraction", () => {
  it("returns 0 when there's no target", () => {
    expect(progressFraction(150, null)).toBe(0);
    expect(progressFraction(150, 0)).toBe(0);
  });

  it("computes the fraction of target reached", () => {
    expect(progressFraction(50, 200)).toBe(0.25);
  });

  it("clamps to 1 when current exceeds target", () => {
    expect(progressFraction(300, 200)).toBe(1);
  });

  it("clamps to 0 for negative current", () => {
    expect(progressFraction(-10, 200)).toBe(0);
  });
});
