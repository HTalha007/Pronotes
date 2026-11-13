import { replaceVaultPayload, type VaultNote } from '../../entities/note';
import {
  NoteKindMismatchError,
  type AccessDeniedError,
  type NotFoundError,
  type ValidationError,
  type VaultLockedError,
} from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { Clock } from '../../services/platform-services';
import type { VaultCipher } from '../../services/vault-cipher';
import { utf8Encode } from '../../shared/bytes';
import { err, ok, type Result } from '../../shared/result';
import type { CrdtState } from '../../value-objects/crdt-state';
import type { NoteId, UserId } from '../../value-objects/ids';
import { createNoteTitle } from '../../value-objects/note-title';
import { encodeVaultNotePayload } from '../../value-objects/vault-note-payload';
import { loadOwnedNote } from '../notes/load-owned-note';
import type { UseCase } from '../use-case';

export interface UpdateVaultNoteInput {
  readonly ownerId: UserId;
  readonly noteId: NoteId;
  readonly title: string;
  readonly plainText: string;
  readonly crdtState: CrdtState;
}

export type UpdateVaultNoteError =
  | NotFoundError
  | AccessDeniedError
  | NoteKindMismatchError
  | ValidationError
  | VaultLockedError;

/** Re-encrypts the whole payload with a fresh IV and replaces the stored blob. */
export class UpdateVaultNote
  implements UseCase<UpdateVaultNoteInput, Result<VaultNote, UpdateVaultNoteError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly cipher: VaultCipher,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateVaultNoteInput): Promise<Result<VaultNote, UpdateVaultNoteError>> {
    const loaded = await loadOwnedNote(this.notes, input.ownerId, input.noteId);
    if (!loaded.ok) {
      return loaded;
    }
    if (loaded.value.kind !== 'vault') {
      return err(new NoteKindMismatchError('vault'));
    }
    const title = createNoteTitle(input.title);
    if (!title.ok) {
      return title;
    }

    const encrypted = await this.cipher.encrypt(
      encodeVaultNotePayload({
        title: title.value,
        plainText: input.plainText,
        crdtState: input.crdtState,
      }),
      utf8Encode(loaded.value.id),
    );
    if (!encrypted.ok) {
      return encrypted;
    }

    const updated = replaceVaultPayload(loaded.value, encrypted.value, this.clock.now());
    await this.notes.save(updated);
    return ok(updated);
  }
}
