import { ValidationError } from '../errors/domain-errors';
import { err, ok, type Result } from '../shared/result';

export const MIN_PBKDF2_ITERATIONS = 100_000;
export const MIN_SALT_LENGTH = 16;

/**
 * Key-derivation parameters. They are NOT secret: the salt is stored next to
 * the vault (and synced) so a second device can derive the same key.
 */
export interface KdfParams {
  readonly algorithm: 'PBKDF2';
  readonly hash: 'SHA-256';
  readonly iterations: number;
  readonly salt: Uint8Array;
}

export function createKdfParams(
  iterations: number,
  salt: Uint8Array,
): Result<KdfParams, ValidationError> {
  if (!Number.isInteger(iterations) || iterations < MIN_PBKDF2_ITERATIONS) {
    return err(
      new ValidationError('iterations', `PBKDF2 needs at least ${MIN_PBKDF2_ITERATIONS} iterations.`),
    );
  }
  if (salt.length < MIN_SALT_LENGTH) {
    return err(new ValidationError('salt', `Salt must be at least ${MIN_SALT_LENGTH} bytes.`));
  }
  return ok({ algorithm: 'PBKDF2', hash: 'SHA-256', iterations, salt });
}
