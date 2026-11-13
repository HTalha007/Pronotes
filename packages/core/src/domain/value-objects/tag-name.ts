import { ValidationError } from '../errors/domain-errors';
import type { Brand } from '../shared/brand';
import { err, ok, type Result } from '../shared/result';

export const MAX_TAG_NAME_LENGTH = 50;

export type TagName = Brand<string, 'TagName'>;

export function createTagName(raw: string): Result<TagName, ValidationError> {
  const value = raw.trim();
  if (value.length === 0) {
    return err(new ValidationError('name', 'Tag name cannot be empty.'));
  }
  if (value.length > MAX_TAG_NAME_LENGTH) {
    return err(
      new ValidationError(
        'name',
        `Tag name must be at most ${MAX_TAG_NAME_LENGTH} characters.`,
      ),
    );
  }
  return ok(value as TagName);
}
