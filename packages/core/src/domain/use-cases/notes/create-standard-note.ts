import { createStandardNote, type StandardNote } from '../../entities/note';
import type { ValidationError } from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import type { Clock, IdGenerator } from '../../services/platform-services';
import type { Result } from '../../shared/result';
import { ok } from '../../shared/result';
import type { CrdtState } from '../../value-objects/crdt-state';
import type { TagId, UserId } from '../../value-objects/ids';
import { createNoteTitle, EMPTY_NOTE_TITLE } from '../../value-objects/note-title';
import type { UseCase } from '../use-case';

export interface CreateStandardNoteInput {
  readonly ownerId: UserId;
  readonly title?: string;
  readonly tagIds?: readonly TagId[];
  readonly body?: { readonly content: CrdtState; readonly plainText: string };
}

/** FR-1/FR-6: "New note" creates an empty card instantly, works offline. */
export class CreateStandardNote
  implements UseCase<CreateStandardNoteInput, Result<StandardNote, ValidationError>>
{
  constructor(
    private readonly notes: NoteRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateStandardNoteInput): Promise<Result<StandardNote, ValidationError>> {
    let title = EMPTY_NOTE_TITLE;
    if (input.title !== undefined) {
      const parsed = createNoteTitle(input.title);
      if (!parsed.ok) {
        return parsed;
      }
      title = parsed.value;
    }

    const note = createStandardNote({
      id: this.ids.newNoteId(),
      ownerId: input.ownerId,
      title,
      tagIds: input.tagIds,
      content: input.body?.content,
      plainText: input.body?.plainText,
      now: this.clock.now(),
    });
    await this.notes.save(note);
    return ok(note);
  }
}
