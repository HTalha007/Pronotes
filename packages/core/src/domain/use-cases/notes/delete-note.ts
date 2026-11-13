import { markNoteDeleted } from '../../entities/note';
import type { AccessDeniedError, NotFoundError } from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { Clock } from '../../services/platform-services';
import { ok, type Result } from '../../shared/result';
import type { NoteId, UserId } from '../../value-objects/ids';
import type { UseCase } from '../use-case';
import { loadOwnedNote } from './load-owned-note';

export interface DeleteNoteInput {
  readonly ownerId: UserId;
  readonly noteId: NoteId;
}

/**
 * Soft-deletes a standard OR vault note (optimistic UI: it disappears at once,
 * the tombstone syncs in the background). No vault unlock needed: nothing is decrypted.
 */
export class DeleteNote
  implements UseCase<DeleteNoteInput, Result<void, NotFoundError | AccessDeniedError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeleteNoteInput): Promise<Result<void, NotFoundError | AccessDeniedError>> {
    const loaded = await loadOwnedNote(this.notes, input.ownerId, input.noteId);
    if (!loaded.ok) {
      return loaded;
    }
    await this.notes.save(markNoteDeleted(loaded.value, this.clock.now()));
    return ok(undefined);
  }
}
