import { updateStandardNote, type StandardNote } from '../../entities/note';
import {
  NoteKindMismatchError,
  type AccessDeniedError,
  type NotFoundError,
  type ValidationError,
} from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { Clock } from '../../services/platform-services';
import { err, ok, type Result } from '../../shared/result';
import type { CrdtState } from '../../value-objects/crdt-state';
import type { NoteId, TagId, UserId } from '../../value-objects/ids';
import { createNoteTitle, type NoteTitle } from '../../value-objects/note-title';
import type { UseCase } from '../use-case';
import { loadOwnedNote } from './load-owned-note';

export interface UpdateStandardNoteInput {
  readonly ownerId: UserId;
  readonly noteId: NoteId;
  readonly title?: string;
  /** The editor (Tiptap/Yjs) supplies the CRDT state and its text projection together. */
  readonly body?: { readonly content: CrdtState; readonly plainText: string };
  readonly tagIds?: readonly TagId[];
}

export type UpdateStandardNoteError =
  | NotFoundError
  | AccessDeniedError
  | NoteKindMismatchError
  | ValidationError;

/** Persists an editor change locally; background sync pushes it later. */
export class UpdateStandardNote
  implements UseCase<UpdateStandardNoteInput, Result<StandardNote, UpdateStandardNoteError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: UpdateStandardNoteInput,
  ): Promise<Result<StandardNote, UpdateStandardNoteError>> {
    const loaded = await loadOwnedNote(this.notes, input.ownerId, input.noteId);
    if (!loaded.ok) {
      return loaded;
    }
    if (loaded.value.kind !== 'standard') {
      return err(new NoteKindMismatchError('standard'));
    }

    let title: NoteTitle | undefined;
    if (input.title !== undefined) {
      const parsed = createNoteTitle(input.title);
      if (!parsed.ok) {
        return parsed;
      }
      title = parsed.value;
    }

    const updated = updateStandardNote(
      loaded.value,
      { title, body: input.body, tagIds: input.tagIds },
      this.clock.now(),
    );
    await this.notes.save(updated);
    return ok(updated);
  }
}
