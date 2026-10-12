import type { IsoDate } from "../types";

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Formats a Date as YYYY-MM-DD using the local calendar day. */
export function formatIsoDate(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts an ISO date to milliseconds at UTC midnight.
 * Throws if the text is not a real calendar date.
 */
function utcMillisOf(date: IsoDate): number {
  const match = ISO_DATE_PATTERN.exec(date);
  if (match === null) {
    throw new Error(`Not an ISO date (YYYY-MM-DD): ${JSON.stringify(date)}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const millis = Date.UTC(year, month - 1, day);

  // Date.UTC rolls invalid dates over (2026-02-30 becomes 2026-03-02).
  // Reading the parts back and comparing detects that.
  const check = new Date(millis);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Not a real calendar date: ${JSON.stringify(date)}`);
  }
  return millis;
}

/**
 * Adds a whole number of calendar days (negative to subtract).
 * Uses UTC arithmetic so daylight saving changes cannot shift the result.
 * Throws on an invalid date or a non-integer day count.
 */
export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isInteger(days)) {
    throw new Error(`Day count must be a whole number: ${days}`);
  }
  const shifted = new Date(utcMillisOf(date) + days * MS_PER_DAY);
  if (Number.isNaN(shifted.getTime())) {
    throw new Error(`Day count out of range: ${days}`);
  }
  const year = String(shifted.getUTCFullYear()).padStart(4, "0");
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}