import type { EncryptedBlob } from '../value-objects/encrypted-blob';
import type { UserId } from '../value-objects/ids';
import type { KdfParams } from '../value-objects/kdf-params';

/** Known plaintext encrypted at setup; decrypting it proves the password locally. */
export const VAULT_VERIFIER_PLAINTEXT = 'pronotes-vault-verifier-v1';

/**
 * Per-user vault configuration. Contains no secret: KDF parameters (incl. salt)
 * and a verifier blob. The master password and derived key are never part of it.
 */
export interface Vault {
  readonly ownerId: UserId;
  readonly kdfParams: KdfParams;
  readonly verifier: EncryptedBlob;
  readonly createdAt: Date;
}

export function createVault(params: {
  readonly ownerId: UserId;
  readonly kdfParams: KdfParams;
  readonly verifier: EncryptedBlob;
  readonly now: Date;
}): Vault {
  return {
    ownerId: params.ownerId,
    kdfParams: params.kdfParams,
    verifier: params.verifier,
    createdAt: params.now,
  };
}
