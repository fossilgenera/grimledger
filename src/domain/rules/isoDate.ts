import type { IsoDate } from "../types";

/** Formats a Date as YYYY-MM-DD using the local calendar day. */
export function formatIsoDate(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}