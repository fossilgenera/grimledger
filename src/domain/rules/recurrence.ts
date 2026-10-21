import { fail, ok, type Result } from "../result";
import { RECURRENCE_UNITS, type IsoDate, type RecurrenceUnit } from "../types";
import { addDays } from "./isoDate";

export interface Recurrence {
  unit: RecurrenceUnit;
  every: number;
}

export const MAX_RECURRENCE_EVERY = 999;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TRAILING_DATE_PATTERN = /\s\d{4}-\d{2}-\d{2}$/;

function daysInMonth(year: number, monthIndex: number): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function parseParts(date: IsoDate): {
  year: number;
  month: number;
  day: number;
} {
  const match = ISO_DATE_PATTERN.exec(date);
  if (!match) throw new Error(`Invalid ISO date: ${date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month - 1)
  ) {
    throw new Error(`Invalid ISO date: ${date}`);
  }
  return { year, month, day };
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/**
 * Adds calendar months. If the target month is shorter, the day is clamped to
 * the last day of that month (31 January + 1 month = 28 or 29 February).
 */
export function addMonths(date: IsoDate, months: number): IsoDate {
  if (!Number.isInteger(months)) {
    throw new Error(`Month count must be a whole number: ${months}`);
  }
  const { year, month, day } = parseParts(date);
  const total = year * 12 + (month - 1) + months;
  const targetMonthIndex = ((total % 12) + 12) % 12;
  const targetYear = (total - targetMonthIndex) / 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonthIndex));
  return `${pad(targetYear, 4)}-${pad(targetMonthIndex + 1, 2)}-${pad(targetDay, 2)}`;
}

export function validateRecurrence(unit: unknown, every: unknown): Result<Recurrence> {
  if (!(RECURRENCE_UNITS as readonly unknown[]).includes(unit)) {
    return fail(`Invalid repeat unit "${String(unit)}"`);
  }
  if (
    typeof every !== "number" ||
    !Number.isInteger(every) ||
    every < 1 ||
    every > MAX_RECURRENCE_EVERY
  ) {
    return fail(
      `Repeat interval must be a whole number from 1 to ${MAX_RECURRENCE_EVERY}`,
    );
  }
  return ok({ unit: unit as RecurrenceUnit, every });
}

function addInterval(date: IsoDate, recurrence: Recurrence): IsoDate {
  switch (recurrence.unit) {
    case "day":
      return addDays(date, recurrence.every);
    case "week":
      return addDays(date, recurrence.every * 7);
    case "month":
      return addMonths(date, recurrence.every);
  }
}

/**
 * The next due date, anchored to the schedule (previous due date plus the interval),
 * advanced until it is strictly after today.
 * 
 * Terminates because every step moves the date forward by at least one day.
 */
export function nextDueDate(
    previousDue: IsoDate,
    recurrence: Recurrence,
    today: IsoDate,
): IsoDate {
    if (!validateRecurrence(recurrence.unit, recurrence.every).ok) {
        throw new Error("Invalid recurrence");
    }
    let next = addInterval(previousDue, recurrence);
    while (next <= today) {
        next = addInterval(next, recurrence);
    }
    return next;
}

/** Base name plus the due date. A trailing date on the old name is replaced. */
export function nextOccurrenceName(currentName: string, nextDue: IsoDate): string {
    const base = currentName.trim().replace(TRAILING_DATE_PATTERN, "").trim();
    return `${base} ${nextDue}`;
}
