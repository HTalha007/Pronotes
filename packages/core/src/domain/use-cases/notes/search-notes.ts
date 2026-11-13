import type { StandardNote } from '../../entities/note';
import type { NoteRepository } from '../../repositories/note-repository';
import { ok, type Result } from '../../shared/result';
import { matchesQuery } from '../../shared/text';
import type { UserId } from '../../value-objects/ids';
import type { UseCase } from '../use-case';

export interface SearchNotesInput {
  readonly ownerId: UserId;
  readonly query: string;
}

/**
 * Local, offline-capable search over title + text of standard notes
 * (case- and diacritic-insensitive). An empty query returns everything.
 * Vault notes are intentionally excluded (see ListVaultNotes).
 */
export class SearchNotes
  implements UseCase<SearchNotesInput, Result<readonly StandardNote[], never>>
{
  constructor(private readonly notes: NoteRepository) {}

  async execute(input: SearchNotesInput): Promise<Result<readonly StandardNote[], never>> {
    const found = await this.notes.findStandardByOwner(input.ownerId);
    const matches = found.filter((note) => matchesQuery(input.query, [note.title, note.plainText]));
    return ok(matches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
  }
}
