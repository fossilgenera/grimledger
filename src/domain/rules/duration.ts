import { fail, ok, type Result } from "../result";

// Matches a bare integer, read as minutes: "90".
const BARE_MINUTES = /^\d{1,5}$/;

// Matches an optional hours part then an optional minutes part:
// "2h", "45m", "1h 30m", "1h30m". Case-insensitive, spaces allowed.
// An empty string also matches, so it is rejected before this runs.
const HOURS_MINUTES = /^(?:(\d{1,5})\s*h)?\s*(?:(\d{1,5})\s*m)?$/i;

const EXAMPLES = "Use for example 90, 45m, 2h or 1h 30m.";

export function parseDuration(input: string): Result<number> {
  const text = input.trim();
  if (text === "") {
    return fail(`Enter a duration. ${EXAMPLES}`);
  }

  let minutes: number;
  if (BARE_MINUTES.test(text)) {
    minutes = Number(text);
  } else {
    const match = HOURS_MINUTES.exec(text);
    if (!match) {
      return fail(`"${text}" is not a valid duration. ${EXAMPLES}`);
    }
    const hours = match[1] === undefined ? 0 : Number(match[1]);
    const extra = match[2] === undefined ? 0 : Number(match[2]);
    minutes = hours * 60 + extra;
  }

  if (minutes <= 0) {
    return fail("Duration must be greater than zero.");
  }
  return ok(minutes);
}

// For optional form fields: empty means "no value", not an error.
export function parseOptionalDuration(
  input: string,
): Result<number | undefined> {
  if (input.trim() === "") {
    return ok(undefined);
  }
  return parseDuration(input);
}

// Formatting a bad number is a programming mistake, so this throws.
export function formatDuration(totalMinutes: number): string {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0) {
    throw new Error(`Invalid duration in minutes: ${totalMinutes}`);
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}