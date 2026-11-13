import type { DecryptionFailedError, VaultLockedError } from '../errors/domain-errors';
import type { Result } from '../shared/result';
import type { EncryptedBlob } from '../value-objects/encrypted-blob';
import type { KdfParams } from '../value-objects/kdf-params';
import type { MasterPassword } from '../value-objects/master-password';

/**
 * Port: cryptography engine. The infrastructure adapter runs PBKDF2 +
 * AES-256-GCM (WebCrypto) inside a Web Worker and keeps the derived key ONLY
 * in worker memory (non-extractable). The domain never sees a key.
 */
export interface VaultCipher {
  /** Fresh parameters with a random salt. */
  createKdfParams(): Promise<KdfParams>;
  /** Derives and holds the key in memory. Does NOT verify the password. */
  unlock(password: MasterPassword, params: KdfParams): Promise<void>;
  /** Wipes the in-memory key. Idempotent. */
  lock(): Promise<void>;
  /** Whether a key is currently held in memory. */
  isUnlocked(): Promise<boolean>;
  encrypt(plaintext: Uint8Array, aad?: Uint8Array): Promise<Result<EncryptedBlob, VaultLockedError>>;
  /** A wrong key or mismatched AAD surfaces as `DecryptionFailedError` (GCM tag mismatch). */
  decrypt(
    blob: EncryptedBlob,
    aad?: Uint8Array,
  ): Promise<Result<Uint8Array, VaultLockedError | DecryptionFailedError>>;
}
