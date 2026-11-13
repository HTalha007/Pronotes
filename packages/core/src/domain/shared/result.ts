/**
 * Explicit success/failure container. Use cases return `Result` instead of
 * throwing for *expected* failures (validation, wrong password, not found...).
 * Exceptions are reserved for unexpected infrastructure faults.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
