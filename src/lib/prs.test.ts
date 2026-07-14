import { describe, expect, it } from "vitest";
import { checkNewPr, computePrs, estimated1Rm, isAnyPr } from "./prs";

describe("estimated1Rm", () => {
  it("applies the Epley formula", () => {
    expect(estimated1Rm(100, 10)).toBeCloseTo(133.33, 1);
  });

  it("returns 0 for non-positive reps", () => {
    expect(estimated1Rm(100, 0)).toBe(0);
  });
});

describe("computePrs", () => {
  it("returns null for no sets", () => {
    expect(computePrs([])).toBeNull();
  });

  it("finds the best in each category across sets", () => {
    const prs = computePrs([
      { weight: 80, reps: 10 },
      { weight: 100, reps: 5 },
      { weight: 60, reps: 15 },
    ]);
    expect(prs?.heaviestWeight).toBe(100);
    expect(prs?.heaviestWeightReps).toBe(5);
    expect(prs?.mostReps).toBe(15);
    expect(prs?.mostRepsWeight).toBe(60);
    // 80x10 = 800 volume is the largest of {800, 500, 900} -> actually 60x15=900
    expect(prs?.bestSetVolume).toBe(900);
  });
});

describe("checkNewPr", () => {
  it("treats the first-ever set as a PR in every category", () => {
    const hit = checkNewPr([], { weight: 50, reps: 5 });
    expect(isAnyPr(hit)).toBe(true);
    expect(hit.heaviestWeight).toBe(true);
    expect(hit.bestEstimated1Rm).toBe(true);
    expect(hit.mostReps).toBe(true);
    expect(hit.bestSetVolume).toBe(true);
  });

  it("flags only categories genuinely beaten", () => {
    const prior = [{ weight: 100, reps: 5 }];
    // Heavier weight but fewer reps and lower volume/1RM than prior.
    const hit = checkNewPr(prior, { weight: 110, reps: 1 });
    expect(hit.heaviestWeight).toBe(true);
    expect(hit.mostReps).toBe(false);
    expect(hit.bestSetVolume).toBe(false); // 110 < 500
  });

  it("reports no PR when the set doesn't beat anything", () => {
    const prior = [{ weight: 100, reps: 10 }];
    const hit = checkNewPr(prior, { weight: 50, reps: 5 });
    expect(isAnyPr(hit)).toBe(false);
  });
});
