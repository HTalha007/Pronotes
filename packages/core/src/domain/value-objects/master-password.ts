import { ValidationError } from '../errors/domain-errors';
import type { Brand } from '../shared/brand';
import { err, ok, type Result } from '../shared/result';

export const MIN_MASTER_PASSWORD_LENGTH = 8;
const MAX_MASTER_PASSWORD_LENGTH = 1024;

/**
 * Vault master password. It is NEVER persisted, logged or sent to a server;
 * it only travels from the UI to the crypto worker to derive a key.
 * Not trimmed on purpose: whitespace is part of the secret.
 */
export type MasterPassword = Brand<string, 'MasterPassword'>;

export function createMasterPassword(raw: string): Result<MasterPassword, ValidationError> {
  if (raw.length < MIN_MASTER_PASSWORD_LENGTH) {
    return err(
      new ValidationError(
        'masterPassword',
        `Master password must be at least ${MIN_MASTER_PASSWORD_LENGTH} characters.`,
      ),
    );
  }
  if (raw.length > MAX_MASTER_PASSWORD_LENGTH) {
    return err(new ValidationError('masterPassword', 'Master password is too long.'));
  }
  return ok(raw as MasterPassword);
}
