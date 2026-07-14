import { describe, it, expect } from "vitest";
import {
  currentStreak,
  painFreePercent,
  averageReachForMonth,
  checklistCompletionRate,
  toCsv,
  shiftYearMonth,
  type LogRow,
} from "./stats";

function log(date: string, pain: number, reach: number, checks: Record<string, boolean> = {}): LogRow {
  return { date, pain, reach, note: "", checks };
}

describe("currentStreak", () => {
  it("counts consecutive logged days ending today", () => {
    const logs = [log("2026-07-12", 1, 1), log("2026-07-13", 1, 1), log("2026-07-14", 1, 1)];
    expect(currentStreak(logs, "2026-07-14")).toBe(3);
  });
  it("is 0 if today isn't logged", () => {
    const logs = [log("2026-07-12", 1, 1), log("2026-07-13", 1, 1)];
    expect(currentStreak(logs, "2026-07-14")).toBe(0);
  });
  it("stops at a gap", () => {
    const logs = [log("2026-07-10", 1, 1), log("2026-07-13", 1, 1), log("2026-07-14", 1, 1)];
    expect(currentStreak(logs, "2026-07-14")).toBe(2);
  });
});

describe("painFreePercent", () => {
  it("computes percent of pain=0 days", () => {
    const logs = [log("2026-07-01", 0, 0), log("2026-07-02", 3, 1), log("2026-07-03", 0, 0), log("2026-07-04", 2, 1)];
    expect(painFreePercent(logs)).toBe(50);
  });
  it("is 0 for empty logs", () => {
    expect(painFreePercent([])).toBe(0);
  });
});

describe("averageReachForMonth", () => {
  it("averages reach within the given month", () => {
    const logs = [log("2026-07-01", 1, 2), log("2026-07-15", 1, 4), log("2026-08-01", 1, 5)];
    expect(averageReachForMonth(logs, "2026-07")).toBe(3);
    expect(averageReachForMonth(logs, "2026-08")).toBe(5);
  });
  it("is null for a month with no logs", () => {
    expect(averageReachForMonth([], "2026-06")).toBeNull();
  });
});

describe("shiftYearMonth", () => {
  it("shifts backward across a year boundary", () => {
    expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
  });
  it("shifts forward within a year", () => {
    expect(shiftYearMonth("2026-07", 1)).toBe("2026-08");
  });
});

describe("checklistCompletionRate", () => {
  it("computes percent of checked items across logs with checks", () => {
    const logs = [
      log("2026-07-01", 1, 1, { a: true, b: false }),
      log("2026-07-02", 1, 1, { a: true, b: true }),
      log("2026-07-03", 1, 1, {}), // no checks recorded — excluded
    ];
    expect(checklistCompletionRate(logs)).toBe(75);
  });
});

describe("toCsv", () => {
  it("produces a header row plus one row per log, escaping notes", () => {
    const logs = [log("2026-07-01", 3, 2, { sphinx_am: true })];
    logs[0].note = 'walked, "felt fine"';
    const csv = toCsv(logs);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("date,pain,reach,note,sphinx_am,pressups,walk,nolift,deskbreaks,pool,gym");
    expect(lines[1]).toContain("2026-07-01,3,2");
    expect(lines[1]).toContain('"walked, ""felt fine"""');
  });
});
