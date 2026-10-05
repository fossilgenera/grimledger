/** The outcome of mapping untrusted data: a value, or a reason it was rejected. */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail(reason: string): Result<never> {
  return { ok: false, reason };
}
