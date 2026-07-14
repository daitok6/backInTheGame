import { describe, it, expect } from "vitest";
import { topWeightBySessionDate, volumeBySessionDate } from "./workoutStats";

describe("topWeightBySessionDate", () => {
  it("takes the heaviest set per session date", () => {
    const sets = [
      { sessionDate: "2026-07-01", weight: 80, reps: 5 },
      { sessionDate: "2026-07-01", weight: 85, reps: 3 },
      { sessionDate: "2026-07-03", weight: 90, reps: 1 },
    ];
    expect(topWeightBySessionDate(sets)).toEqual([
      { date: "2026-07-01", topWeight: 85 },
      { date: "2026-07-03", topWeight: 90 },
    ]);
  });

  it("returns dates sorted chronologically regardless of input order", () => {
    const sets = [
      { sessionDate: "2026-07-10", weight: 100, reps: 1 },
      { sessionDate: "2026-07-05", weight: 90, reps: 1 },
    ];
    const result = topWeightBySessionDate(sets);
    expect(result.map((p) => p.date)).toEqual(["2026-07-05", "2026-07-10"]);
  });

  it("returns an empty array for no sets", () => {
    expect(topWeightBySessionDate([])).toEqual([]);
  });
});

describe("volumeBySessionDate", () => {
  it("sums weight x reps per session date", () => {
    const sets = [
      { sessionDate: "2026-07-01", weight: 80, reps: 5 },
      { sessionDate: "2026-07-01", weight: 85, reps: 3 },
    ];
    expect(volumeBySessionDate(sets)).toEqual([{ date: "2026-07-01", topWeight: 655 }]);
  });
});
