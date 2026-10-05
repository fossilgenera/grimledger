import type { IsoDate } from "../../domain/types";
import { fail, ok, type MapResult } from "./mapResult";

/** Runtime check that a value is one of the allowed strings. */
export function isOneOf<T extends readonly string[]>(
  allowed: T,
  value: unknown,
): value is T[number] {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

/** For error messages */
export function describeValue(value: unknown): string {
  return value === undefined ? "missing" : JSON.stringify(value);
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRealIsoDate(text: string): boolean {
  const match = ISO_DATE.exec(text);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Missing or empty gives undefined. Present but not a real ISO date is a failure. */
export function readOptionalIsoDate(
  value: unknown,
): MapResult<IsoDate | undefined> {
  if (value === undefined || value === null || value === "") {
    return ok(undefined);
  }
  if (typeof value === "string" && isRealIsoDate(value)) {
    return ok(value);
  }
  return fail(`Invalid ISO date: ${describeValue(value)}, expected YYYY-MM-DD`);
}

/** Missing or empty gives false. Present but not boolean is a failure.*/
export function readBooleanDefaultFalse(value: unknown, fieldName: string): MapResult<boolean> {
  if (value === undefined || value === null || value === "") {
    return ok(false);
  }
  if (typeof value === "boolean") {
    return ok(value);
  }
  return fail(`Invalid ${fieldName}: ${describeValue(value)}, expected true or false`);
}
