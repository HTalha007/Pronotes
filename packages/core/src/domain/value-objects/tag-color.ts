import { ValidationError } from '../errors/domain-errors';
import type { Brand } from '../shared/brand';
import { err, ok, type Result } from '../shared/result';

export const DEFAULT_TAG_COLOR = '#E8ECFB';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export type TagColor = Brand<string, 'TagColor'>;

export function createTagColor(raw?: string): Result<TagColor, ValidationError> {
  if (!raw || raw.trim().length === 0) {
    return ok(DEFAULT_TAG_COLOR as TagColor);
  }
  const value = raw.trim();
  if (!HEX_COLOR_REGEX.test(value)) {
    return err(
      new ValidationError(
        'color',
        `Color must be a valid hex string (e.g. #E8ECFB), got "${raw}".`,
      ),
    );
  }
  return ok(value as TagColor);
}
