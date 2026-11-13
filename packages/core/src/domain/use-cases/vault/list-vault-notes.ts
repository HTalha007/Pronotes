import { VaultLockedError } from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { VaultCipher } from '../../services/vault-cipher';
import { err, ok, type Result } from '../../shared/result';
import { matchesQuery } from '../../shared/text';
import type { NoteId, UserId } from '../../value-objects/ids';
import type { NoteTitle } from '../../value-objects/note-title';
import type { UseCase } from '../use-case';
import { decryptVaultNote } from './decrypt-vault-note';

export interface ListVaultNotesInput {
  readonly ownerId: UserId;
  /** Optional in-memory search; the server can never search vault notes. */
  readonly query?: string;
}

export interface VaultNoteSummary {
  readonly id: NoteId;
  readonly title: NoteTitle;
  readonly plainText: string;
  readonly updatedAt: Date;
}

export interface ListVaultNotesOutput {
  readonly items: readonly VaultNoteSummary[];
  /** Notes that failed to decrypt (corrupted/foreign key); surfaced, never silently dropped. */
  readonly undecryptable: readonly NoteId[];
}

/**
 * Decrypts all vault notes in memory for the vault grid and local search.
 * Decrypted text is returned only; it is never written to disk.
 */
export class ListVaultNotes
  implements UseCase<ListVaultNotesInput, Result<ListVaultNotesOutput, VaultLockedError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly cipher: VaultCipher,
  ) {}

  async execute(input: ListVaultNotesInput): Promise<Result<ListVaultNotesOutput, VaultLockedError>> {
    if (!(await this.cipher.isUnlocked())) {
      return err(new VaultLockedError());
    }
    const stored = await this.notes.findVaultByOwner(input.ownerId);
    const items: VaultNoteSummary[] = [];
    const undecryptable: NoteId[] = [];

    for (const note of stored) {
      const payload = await decryptVaultNote(this.cipher, note);
      if (!payload.ok) {
        if (payload.error instanceof VaultLockedError) {
          return err(payload.error);
        }
        undecryptable.push(note.id);
        continue;
      }
      if (matchesQuery(input.query ?? '', [payload.value.title, payload.value.plainText])) {
        items.push({
          id: note.id,
          title: payload.value.title,
          plainText: payload.value.plainText,
          updatedAt: note.updatedAt,
        });
      }
    }

    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return ok({ items, undecryptable });
  }
}
