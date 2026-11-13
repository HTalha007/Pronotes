import { ValidationError } from '../errors/domain-errors';
import type { Brand } from '../shared/brand';
import { err, ok, type Result } from '../shared/result';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_ACCOUNT_PASSWORD_LENGTH = 8;

export type Email = Brand<string, 'Email'>;

/** Account (login) password; unrelated to the vault master password. */
export type AccountPassword = Brand<string, 'AccountPassword'>;

export function createEmail(raw: string): Result<Email, ValidationError> {
  const value = raw.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(value)) {
    return err(new ValidationError('email', 'Email address is not valid.'));
  }
  return ok(value as Email);
}

export function createAccountPassword(raw: string): Result<AccountPassword, ValidationError> {
  if (raw.length < MIN_ACCOUNT_PASSWORD_LENGTH) {
    return err(
      new ValidationError(
        'password',
        `Password must be at least ${MIN_ACCOUNT_PASSWORD_LENGTH} characters.`,
      ),
    );
  }
  return ok(raw as AccountPassword);
}
