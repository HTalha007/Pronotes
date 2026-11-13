import type { VaultNote } from '../../entities/note';
import {
  NoteKindMismatchError,
  type AccessDeniedError,
  type DecryptionFailedError,
  type NotFoundError,
  type VaultLockedError,
} from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { VaultCipher } from '../../services/vault-cipher';
import { err, ok, type Result } from '../../shared/result';
import type { NoteId, UserId } from '../../value-objects/ids';
import type { VaultNotePayload } from '../../value-objects/vault-note-payload';
import { loadOwnedNote } from '../notes/load-owned-note';
import type { UseCase } from '../use-case';
import { decryptVaultNote } from './decrypt-vault-note';

export interface OpenVaultNoteInput {
  readonly ownerId: UserId;
  readonly noteId: NoteId;
}

export interface OpenedVaultNote {
  readonly note: VaultNote;
  readonly payload: VaultNotePayload;
}

export type OpenVaultNoteError =
  | NotFoundError
  | AccessDeniedError
  | NoteKindMismatchError
  | VaultLockedError
  | DecryptionFailedError;

/** Decrypts one vault note for editing. Requires an unlocked vault. */
export class OpenVaultNote
  implements UseCase<OpenVaultNoteInput, Result<OpenedVaultNote, OpenVaultNoteError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly cipher: VaultCipher,
  ) {}

  async execute(input: OpenVaultNoteInput): Promise<Result<OpenedVaultNote, OpenVaultNoteError>> {
    const loaded = await loadOwnedNote(this.notes, input.ownerId, input.noteId);
    if (!loaded.ok) {
      return loaded;
    }
    if (loaded.value.kind !== 'vault') {
      return err(new NoteKindMismatchError('vault'));
    }
    const payload = await decryptVaultNote(this.cipher, loaded.value);
    if (!payload.ok) {
      return payload;
    }
    return ok({ note: loaded.value, payload: payload.value });
  }
}
