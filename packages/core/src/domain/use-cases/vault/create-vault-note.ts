import { createVaultNote, type VaultNote } from '../../entities/note';
import type { ValidationError, VaultLockedError } from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { Clock, IdGenerator } from '../../services/platform-services';
import type { VaultCipher } from '../../services/vault-cipher';
import { ok, type Result } from '../../shared/result';
import type { CrdtState } from '../../value-objects/crdt-state';
import type { UserId } from '../../value-objects/ids';
import { createNoteTitle } from '../../value-objects/note-title';
import { encodeVaultNotePayload } from '../../value-objects/vault-note-payload';
import type { UseCase } from '../use-case';

export interface CreateVaultNoteInput {
  readonly ownerId: UserId;
  readonly title: string;
  readonly plainText: string;
  readonly crdtState: CrdtState;
}

/** Encrypts title + text + CRDT state into a single blob; only the blob is stored/synced. */
export class CreateVaultNote
  implements
    UseCase<CreateVaultNoteInput, Result<VaultNote, ValidationError | VaultLockedError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly cipher: VaultCipher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: CreateVaultNoteInput,
  ): Promise<Result<VaultNote, ValidationError | VaultLockedError>> {
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
    );
    if (!encrypted.ok) {
      return encrypted;
    }

    const note = createVaultNote({
      id: this.ids.newNoteId(),
      ownerId: input.ownerId,
      encryptedPayload: encrypted.value,
      now: this.clock.now(),
    });
    await this.notes.save(note);
    return ok(note);
  }
}
