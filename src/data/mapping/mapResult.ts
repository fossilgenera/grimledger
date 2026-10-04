/** The outcome of mapping untrusted data: a value, or a reason it was rejected. */
export type MapResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

export function ok<T>(value: T): MapResult<T> {
  return { ok: true, value };
}

export function fail(reason: string): MapResult<never> {
  return { ok: false, reason };
}
