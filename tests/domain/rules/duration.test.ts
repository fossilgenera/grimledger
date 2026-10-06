import { describe, expect, it } from "vitest";
import {
  formatDuration,
  parseDuration,
  parseOptionalDuration,
} from "../../../src/domain/rules/duration";

describe("parseDuration: accepted input", () => {
  it.each([
    ["90", 90],
    ["1", 1],
    ["45m", 45],
    ["2h", 120],
    ["1h 30m", 90],
    ["1h30m", 90],
    ["1H 30M", 90],
    ["1 h 30 m", 90],
    ["2h 90m", 210],
    ["  45m  ", 45],
    ["0h 15m", 15],
  ])("parses %j as %i minutes", (input, expected) => {
    const result = parseDuration(input);
    expect(result).toEqual({ ok: true, value: expected });
  });
});

describe("parseDuration: rejected input", () => {
  it.each([
    [""],
    ["   "],
    ["0"],
    ["0m"],
    ["0h"],
    ["abc"],
    ["h"],
    ["1.5h"],
    ["1,5h"],
    ["-30"],
    ["30m 1h"],
    ["1h 30"],
    ["1d"],
    ["100000"],
    ["100000h"],
  ])("rejects %j", (input) => {
    expect(parseDuration(input).ok).toBe(false);
  });

  it("gives a reason that shows example formats", () => {
    const result = parseDuration("abc");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("1h 30m");
    }
  });
});

describe("parseOptionalDuration", () => {
  it("returns undefined for empty input", () => {
    expect(parseOptionalDuration("")).toEqual({ ok: true, value: undefined });
  });

  it("returns undefined for whitespace-only input", () => {
    expect(parseOptionalDuration("   ")).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it("parses a valid value", () => {
    expect(parseOptionalDuration("2h")).toEqual({ ok: true, value: 120 });
  });

  it("still rejects invalid input", () => {
    expect(parseOptionalDuration("abc").ok).toBe(false);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [1, "1m"],
    [45, "45m"],
    [60, "1h"],
    [90, "1h 30m"],
    [120, "2h"],
    [255, "4h 15m"],
    [1500, "25h"],
  ])("formats %i minutes as %j", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it("throws on a negative value", () => {
    expect(() => formatDuration(-1)).toThrow();
  });

  it("throws on a non-integer value", () => {
    expect(() => formatDuration(1.5)).toThrow();
  });
});

describe("round trip", () => {
  it.each([1, 15, 59, 60, 61, 90, 120, 255, 1500])(
    "parse(format(%i)) returns the same value",
    (minutes) => {
      expect(parseDuration(formatDuration(minutes))).toEqual({
        ok: true,
        value: minutes,
      });
    },
  );
});