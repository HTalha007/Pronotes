import { ValidationError } from '../errors/domain-errors';
import type { Brand } from '../shared/brand';
import { err, ok, type Result } from '../shared/result';

export const MAX_NOTE_TITLE_LENGTH = 200;

/** Trimmed title. Empty is allowed (Keep-style untitled notes). */
export type NoteTitle = Brand<string, 'NoteTitle'>;

export function createNoteTitle(raw: string): Result<NoteTitle, ValidationError> {
  const value = raw.trim();
  if (value.length > MAX_NOTE_TITLE_LENGTH) {
    return err(
      new ValidationError('title', `Title must be at most ${MAX_NOTE_TITLE_LENGTH} characters.`),
    );
  }
  return ok(value as NoteTitle);
}

export const EMPTY_NOTE_TITLE = '' as NoteTitle;
