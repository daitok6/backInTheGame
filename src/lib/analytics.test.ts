import { describe, expect, it } from "vitest";
import {
  isoWeekStart,
  monthlySummary,
  muscleGroupVolume,
  topExercisesByFrequency,
  weeklyVolume,
  type AnalyticsSetRow,
} from "./analytics";

const rows: AnalyticsSetRow[] = [
  {
    sessionId: 1,
    sessionDate: "2026-07-06", // Monday
    exerciseId: 1,
    exerciseName: "Bench Press",
    muscleGroup: "Chest",
    weight: 100,
    reps: 5,
  },
  {
    sessionId: 1,
    sessionDate: "2026-07-06",
    exerciseId: 1,
    exerciseName: "Bench Press",
    muscleGroup: "Chest",
    weight: 100,
    reps: 5,
  },
  {
    sessionId: 2,
    sessionDate: "2026-07-08", // same ISO week as the 6th
    exerciseId: 2,
    exerciseName: "Squat",
    muscleGroup: "Legs",
    weight: 120,
    reps: 5,
  },
  {
    sessionId: 3,
    sessionDate: "2026-07-13", // next Monday
    exerciseId: 3,
    exerciseName: "Curl",
    muscleGroup: null,
    weight: 20,
    reps: 10,
  },
];

describe("isoWeekStart", () => {
  it("returns the same Monday for the whole week", () => {
    expect(isoWeekStart("2026-07-06")).toBe("2026-07-06");
    expect(isoWeekStart("2026-07-08")).toBe("2026-07-06");
    expect(isoWeekStart("2026-07-12")).toBe("2026-07-06"); // Sunday
  });

  it("rolls a Sunday back to the prior Monday", () => {
    expect(isoWeekStart("2026-07-12")).toBe("2026-07-06");
  });
});

describe("muscleGroupVolume", () => {
  it("sums volume per muscle group, largest first, bucketing nulls as Other", () => {
    const result = muscleGroupVolume(rows);
    expect(result[0]).toEqual({ muscleGroup: "Chest", volume: 1000 });
    expect(result.find((r) => r.muscleGroup === "Legs")?.volume).toBe(600);
    expect(result.find((r) => r.muscleGroup === "Other")?.volume).toBe(200);
  });
});

describe("weeklyVolume", () => {
  it("groups by ISO week, oldest first", () => {
    const result = weeklyVolume(rows);
    expect(result).toEqual([
      { weekStart: "2026-07-06", volume: 1000 + 600 },
      { weekStart: "2026-07-13", volume: 200 },
    ]);
  });
});

describe("topExercisesByFrequency", () => {
  it("ranks by set count", () => {
    const result = topExercisesByFrequency(rows, 2);
    expect(result[0]).toEqual({ exerciseId: 1, exerciseName: "Bench Press", setCount: 2 });
    expect(result).toHaveLength(2);
  });
});

describe("monthlySummary", () => {
  it("counts distinct sessions, sets, and total volume for the month", () => {
    const result = monthlySummary(rows, "2026-07");
    expect(result.sessionCount).toBe(3);
    expect(result.setCount).toBe(4);
    expect(result.totalVolume).toBe(1000 + 600 + 200);
  });

  it("excludes rows outside the month", () => {
    const result = monthlySummary(rows, "2026-08");
    expect(result).toEqual({ sessionCount: 0, setCount: 0, totalVolume: 0 });
  });
});
