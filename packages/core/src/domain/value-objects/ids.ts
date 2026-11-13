import { ValidationError } from '../errors/domain-errors';
import type { Brand } from '../shared/brand';
import { err, ok, type Result } from '../shared/result';

export type NoteId = Brand<string, 'NoteId'>;
export type UserId = Brand<string, 'UserId'>;
export type TagId = Brand<string, 'TagId'>;

function parseId<B extends string>(
  raw: string,
  field: string,
): Result<Brand<string, B>, ValidationError> {
  const value = raw.trim();
  if (value.length === 0) {
    return err(new ValidationError(field, `${field} must not be empty.`));
  }
  return ok(value as Brand<string, B>);
}

export function parseNoteId(raw: string): Result<NoteId, ValidationError> {
  return parseId<'NoteId'>(raw, 'noteId');
}

export function parseUserId(raw: string): Result<UserId, ValidationError> {
  return parseId<'UserId'>(raw, 'userId');
}

export function parseTagId(raw: string): Result<TagId, ValidationError> {
  return parseId<'TagId'>(raw, 'tagId');
}
