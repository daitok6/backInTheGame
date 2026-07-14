import { describe, it, expect } from "vitest";
import { daysBetween, addDays, computeDefaultPhase, lastNDays } from "./date";

describe("daysBetween", () => {
  it("computes positive diff for a future date", () => {
    expect(daysBetween("2026-07-14", "2026-08-04")).toBe(21);
  });
  it("computes negative diff for a past date", () => {
    expect(daysBetween("2026-08-04", "2026-07-14")).toBe(-21);
  });
  it("is zero for the same date", () => {
    expect(daysBetween("2026-08-04", "2026-08-04")).toBe(0);
  });
});

describe("addDays", () => {
  it("adds days across a month boundary", () => {
    expect(addDays("2026-07-30", 5)).toBe("2026-08-04");
  });
  it("subtracts days", () => {
    expect(addDays("2026-08-04", -5)).toBe("2026-07-30");
  });
});

describe("computeDefaultPhase", () => {
  const flight = "2026-08-04";
  it("is pre more than 1 day before flight", () => {
    expect(computeDefaultPhase("2026-08-01", flight)).toBe("pre");
  });
  it("is flight the day before, of, and after", () => {
    expect(computeDefaultPhase("2026-08-03", flight)).toBe("flight");
    expect(computeDefaultPhase("2026-08-04", flight)).toBe("flight");
    expect(computeDefaultPhase("2026-08-05", flight)).toBe("flight");
  });
  it("is kl more than 1 day after flight", () => {
    expect(computeDefaultPhase("2026-08-06", flight)).toBe("kl");
  });
});

describe("lastNDays", () => {
  it("returns n days ending at today, oldest first", () => {
    const result = lastNDays("2026-08-04", 5);
    expect(result).toEqual([
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
    ]);
  });
});
