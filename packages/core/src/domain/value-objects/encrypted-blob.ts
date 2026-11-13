import { ValidationError } from '../errors/domain-errors';
import { err, ok, type Result } from '../shared/result';

export const AES_GCM_IV_LENGTH = 12;
export const AES_GCM_TAG_LENGTH = 16;

/**
 * Output of AES-256-GCM. `ciphertext` already contains the 128-bit
 * authentication tag, so a wrong key fails decryption locally (no server).
 */
export interface EncryptedBlob {
  readonly version: 1;
  readonly iv: Uint8Array;
  readonly ciphertext: Uint8Array;
}

export function createEncryptedBlob(
  iv: Uint8Array,
  ciphertext: Uint8Array,
): Result<EncryptedBlob, ValidationError> {
  if (iv.length !== AES_GCM_IV_LENGTH) {
    return err(new ValidationError('iv', `IV must be ${AES_GCM_IV_LENGTH} bytes.`));
  }
  if (ciphertext.length < AES_GCM_TAG_LENGTH) {
    return err(new ValidationError('ciphertext', 'Ciphertext is too short to hold a GCM tag.'));
  }
  return ok({ version: 1, iv, ciphertext });
}
