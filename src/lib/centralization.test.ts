import { describe, it, expect } from "vitest";
import { computeCentralization } from "./centralization";

function days(reaches: (number | null)[]): { date: string; reach: number | null }[] {
  return reaches.map((reach, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    reach,
  }));
}

describe("computeCentralization", () => {
  it("returns insufficient with fewer than 2 logged days", () => {
    expect(computeCentralization(days([null, null, 3])).verdict).toBe("insufficient");
    expect(computeCentralization([]).verdict).toBe("insufficient");
  });

  it("detects retreating pain (reach decreasing over time)", () => {
    const result = computeCentralization(days([5, 5, 4, 2, 1, 1]));
    expect(result.verdict).toBe("retreating");
  });

  it("detects spreading pain (reach increasing over time)", () => {
    const result = computeCentralization(days([1, 1, 2, 4, 5, 5]));
    expect(result.verdict).toBe("spreading");
  });

  it("detects steady pain (little change)", () => {
    const result = computeCentralization(days([3, 3, 3, 3, 3, 3]));
    expect(result.verdict).toBe("steady");
  });

  it("ignores unlogged days when computing averages", () => {
    const result = computeCentralization(days([5, null, null, 1]));
    expect(result.loggedCount).toBe(2);
    expect(result.verdict).toBe("retreating");
  });
});
