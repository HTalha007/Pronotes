/**
 * Domain errors carry a stable machine-readable `code`. The UI maps `code`
 * to localized copy; messages here are developer-facing (English).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(
    readonly entity: string,
    readonly id: string,
  ) {
    super(`${entity} "${id}" was not found.`);
  }
}

export class AccessDeniedError extends DomainError {
  readonly code = 'ACCESS_DENIED';

  constructor(readonly entity: string) {
    super(`The current user is not allowed to access this ${entity}.`);
  }
}

export class NoteKindMismatchError extends DomainError {
  readonly code = 'NOTE_KIND_MISMATCH';

  constructor(readonly expected: 'standard' | 'vault') {
    super(`Operation requires a ${expected} note.`);
  }
}

export class VaultNotSetupError extends DomainError {
  readonly code = 'VAULT_NOT_SETUP';

  constructor() {
    super('The vault has not been set up yet.');
  }
}

export class VaultAlreadySetupError extends DomainError {
  readonly code = 'VAULT_ALREADY_SETUP';

  constructor() {
    super('The vault has already been set up for this user.');
  }
}

export class VaultLockedError extends DomainError {
  readonly code = 'VAULT_LOCKED';

  constructor() {
    super('The vault is locked. Enter the master password first.');
  }
}

/** Raised locally when AES-GCM authentication of the verifier fails. */
export class InvalidMasterPasswordError extends DomainError {
  readonly code = 'INVALID_MASTER_PASSWORD';

  constructor() {
    super('The master password is incorrect.');
  }
}

export class DecryptionFailedError extends DomainError {
  readonly code = 'DECRYPTION_FAILED';

  constructor(message = 'Data could not be decrypted (wrong key or corrupted data).') {
    super(message);
  }
}

export class AuthenticationError extends DomainError {
  readonly code = 'AUTHENTICATION_FAILED';

  constructor(readonly reason: 'invalid-credentials' | 'email-taken' | 'unavailable') {
    super(`Authentication failed: ${reason}.`);
  }
}

export class SyncFailedError extends DomainError {
  readonly code = 'SYNC_FAILED';

  constructor(message = 'Synchronization failed. It will be retried.') {
    super(message);
  }
}
