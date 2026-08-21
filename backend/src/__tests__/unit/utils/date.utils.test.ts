import { describe, it, expect } from "vitest";
import {
  parseLocalDate,
  startOfLocalDay,
  endOfLocalDay,
  toLocalDateString,
  parseDurationToMinutes,
  hasTimeOverlap,
} from "../../../utils/date.utils";

describe("parseLocalDate", () => {
  it("should parse YYYY-MM-DD to local midnight", () => {
    const date = parseLocalDate("2025-03-15");
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(2); // March = 2
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  it("should handle single-digit months and days", () => {
    const date = parseLocalDate("2025-01-05");
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
  });
});

describe("startOfLocalDay", () => {
  it("should return midnight of the same day", () => {
    const input = new Date(2025, 2, 15, 14, 30, 0);
    const result = startOfLocalDay(input);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getDate()).toBe(15);
  });

  it("should not mutate original date", () => {
    const input = new Date(2025, 2, 15, 14, 30, 0);
    startOfLocalDay(input);
    expect(input.getHours()).toBe(14);
  });
});

describe("endOfLocalDay", () => {
  it("should return 23:59:59.999 of the same day", () => {
    const input = new Date(2025, 2, 15, 14, 30, 0);
    const result = endOfLocalDay(input);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});

describe("toLocalDateString", () => {
  it("should format date as YYYY-MM-DD", () => {
    const date = new Date(2025, 0, 5); // Jan 5
    expect(toLocalDateString(date)).toBe("2025-01-05");
  });

  it("should pad single digits", () => {
    const date = new Date(2025, 11, 25); // Dec 25
    expect(toLocalDateString(date)).toBe("2025-12-25");
  });
});

describe("parseDurationToMinutes", () => {
  it("should parse '2h 30min' to 150 minutes", () => {
    expect(parseDurationToMinutes("2h 30min")).toBe(150);
  });

  it("should parse '2h' without minutes to 120 minutes", () => {
    expect(parseDurationToMinutes("2h")).toBe(120);
  });

  it("should parse '1h' to 60 minutes", () => {
    expect(parseDurationToMinutes("1h")).toBe(60);
  });

  it("should parse '45min' to 45 minutes", () => {
    expect(parseDurationToMinutes("45min")).toBe(45);
  });

  it("should parse '2h 30min' to 150 minutes", () => {
    expect(parseDurationToMinutes("2h 30min")).toBe(150);
  });

  it("should parse plain number as minutes", () => {
    expect(parseDurationToMinutes("90")).toBe(90);
  });

  it("should default to 120 for unrecognised format", () => {
    expect(parseDurationToMinutes("unknown")).toBe(120);
  });
});

describe("hasTimeOverlap", () => {
  it("should detect overlapping ranges", () => {
    expect(hasTimeOverlap(100, 200, 150, 250)).toBe(true);
  });

  it("should detect non-overlapping ranges", () => {
    expect(hasTimeOverlap(100, 200, 200, 300)).toBe(false);
  });

  it("should detect fully contained range", () => {
    expect(hasTimeOverlap(100, 300, 150, 200)).toBe(true);
  });

  it("should detect reverse overlap", () => {
    expect(hasTimeOverlap(150, 250, 100, 200)).toBe(true);
  });
});
