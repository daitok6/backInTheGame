import { describe, expect, it } from "vitest";
import { formatMmSs, remainingSeconds } from "./timer";

describe("remainingSeconds", () => {
  it("returns the full duration at the start", () => {
    expect(remainingSeconds(1000, 90, 1000)).toBe(90);
  });

  it("counts down as time passes", () => {
    expect(remainingSeconds(1000, 90, 1000 + 30_000)).toBe(60);
  });

  it("clamps to 0 once the duration has elapsed", () => {
    expect(remainingSeconds(1000, 90, 1000 + 120_000)).toBe(0);
  });

  it("clamps to the duration for a negative elapsed time", () => {
    expect(remainingSeconds(1000, 90, 500)).toBe(90);
  });
});

describe("formatMmSs", () => {
  it("formats seconds under a minute", () => {
    expect(formatMmSs(45)).toBe("0:45");
  });

  it("formats minutes and seconds", () => {
    expect(formatMmSs(90)).toBe("1:30");
  });

  it("pads seconds under 10", () => {
    expect(formatMmSs(65)).toBe("1:05");
  });

  it("clamps negative input to 0", () => {
    expect(formatMmSs(-5)).toBe("0:00");
  });
});
