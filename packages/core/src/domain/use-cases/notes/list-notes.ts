import type { StandardNote } from '../../entities/note';
import type { NoteRepository } from '../../repositories/note-repository';
import { ok, type Result } from '../../shared/result';
import type { UserId } from '../../value-objects/ids';
import type { UseCase } from '../use-case';

export interface ListNotesInput {
  readonly ownerId: UserId;
}

/** Home grid source: non-deleted standard notes, most recently edited first. */
export class ListNotes
  implements UseCase<ListNotesInput, Result<readonly StandardNote[], never>>
{
  constructor(private readonly notes: NoteRepository) {}

  async execute(input: ListNotesInput): Promise<Result<readonly StandardNote[], never>> {
    const found = await this.notes.findStandardByOwner(input.ownerId);
    return ok([...found].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
  }
}
