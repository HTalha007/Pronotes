import { DecryptionFailedError } from '../errors/domain-errors';
import { base64ToBytes, bytesToBase64, utf8Decode, utf8Encode } from '../shared/bytes';
import { err, ok, type Result } from '../shared/result';
import { toCrdtState, type CrdtState } from './crdt-state';
import type { TagId } from './ids';
import { createNoteTitle, type NoteTitle } from './note-title';

/**
 * Everything that makes a vault note readable. The whole payload is encrypted
 * as ONE blob, so the server sees neither title, text nor CRDT history.
 */
export interface VaultNotePayload {
  readonly title: NoteTitle;
  /** Decrypted text for local, in-memory search only. Never persisted in clear. */
  readonly plainText: string;
  readonly crdtState: CrdtState;
  readonly tagIds?: readonly TagId[];
}

interface SerializedPayload {
  readonly v: 1;
  readonly title: string;
  readonly plainText: string;
  readonly crdtState: string; // base64
  readonly tagIds?: string[];
}

function isSerializedPayload(value: unknown): value is SerializedPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.v === 1 &&
    typeof record.title === 'string' &&
    typeof record.plainText === 'string' &&
    typeof record.crdtState === 'string' &&
    (record.tagIds === undefined || Array.isArray(record.tagIds))
  );
}

export function encodeVaultNotePayload(payload: VaultNotePayload): Uint8Array {
  const serialized: SerializedPayload = {
    v: 1,
    title: payload.title,
    plainText: payload.plainText,
    crdtState: bytesToBase64(payload.crdtState),
    tagIds: payload.tagIds ? [...payload.tagIds] : undefined,
  };
  return utf8Encode(JSON.stringify(serialized));
}

export function decodeVaultNotePayload(
  bytes: Uint8Array,
): Result<VaultNotePayload, DecryptionFailedError> {
  try {
    const parsed: unknown = JSON.parse(utf8Decode(bytes));
    if (!isSerializedPayload(parsed)) {
      return err(new DecryptionFailedError('Vault note payload has an unknown shape.'));
    }
    const title = createNoteTitle(parsed.title);
    if (!title.ok) {
      return err(new DecryptionFailedError('Vault note payload has an invalid title.'));
    }
    return ok({
      title: title.value,
      plainText: parsed.plainText,
      crdtState: toCrdtState(base64ToBytes(parsed.crdtState)),
      tagIds: parsed.tagIds ? (parsed.tagIds as TagId[]) : [],
    });
  } catch {
    return err(new DecryptionFailedError('Vault note payload is corrupted.'));
  }
}
