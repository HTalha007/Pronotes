import type { VaultNote } from '../../entities/note';
import type { DecryptionFailedError, VaultLockedError } from '../../errors/domain-errors';
import type { VaultCipher } from '../../services/vault-cipher';
import { utf8Encode } from '../../shared/bytes';
import type { Result } from '../../shared/result';
import {
  decodeVaultNotePayload,
  type VaultNotePayload,
} from '../../value-objects/vault-note-payload';

/** Decrypts + decodes a vault note. Fails with VaultLocked or DecryptionFailed. */
export async function decryptVaultNote(
  cipher: VaultCipher,
  note: VaultNote,
): Promise<Result<VaultNotePayload, VaultLockedError | DecryptionFailedError>> {
  const decrypted = await cipher.decrypt(note.encryptedPayload, utf8Encode(note.id));
  if (!decrypted.ok) {
    return decrypted;
  }
  return decodeVaultNotePayload(decrypted.value);
}
