import type { Note } from '../../entities/note';
import { AccessDeniedError, NotFoundError } from '../../errors/domain-errors';
import type { NoteRepository } from '../../repositories/note-repository';
import { err, ok, type Result } from '../../shared/result';
import type { NoteId, UserId } from '../../value-objects/ids';

/**
 * Shared authorization/existence guard: the note must exist, not be deleted
 * and belong to the caller. Every note-mutating use case goes through it.
 */
export async function loadOwnedNote(
  notes: NoteRepository,
  ownerId: UserId,
  noteId: NoteId,
): Promise<Result<Note, NotFoundError | AccessDeniedError>> {
  const note = await notes.findById(noteId);
  if (note === null || note.deletedAt !== null) {
    return err(new NotFoundError('Note', noteId));
  }
  if (note.ownerId !== ownerId) {
    return err(new AccessDeniedError('Note'));
  }
  return ok(note);
}
