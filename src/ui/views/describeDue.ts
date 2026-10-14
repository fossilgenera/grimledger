import { daysBetween } from "../../domain/rules/isoDate";
import type { IsoDate } from "../../domain/types";

/**
 * The text shown beside a task's due date: relative for overdue, today and tomorrow, 
 * otherwise the ISO date. Empty text when there is no due date.
 */
export function describeDue(due: IsoDate | undefined, today: IsoDate): string {
    if (due === undefined) return "";

  const days = daysBetween(today, due);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${-days} days overdue`;
  return due;
}