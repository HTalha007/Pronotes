import { updateTagEntity, type Tag } from '../../entities/tag';
import {
  AccessDeniedError,
  NotFoundError,
  type ValidationError,
} from '../../errors/domain-errors';
import type { TagRepository } from '../../repositories/tag-repository';
import type { Clock } from '../../services/platform-services';
import { err, ok, type Result } from '../../shared/result';
import type { TagId, UserId } from '../../value-objects/ids';
import { createTagColor, type TagColor } from '../../value-objects/tag-color';
import { createTagName, type TagName } from '../../value-objects/tag-name';
import type { UseCase } from '../use-case';

export interface UpdateTagInput {
  readonly ownerId: UserId;
  readonly tagId: TagId;
  readonly name?: string;
  readonly color?: string;
}

export type UpdateTagError =
  | NotFoundError
  | AccessDeniedError
  | ValidationError;

export class UpdateTag
  implements UseCase<UpdateTagInput, Result<Tag, UpdateTagError>>
{
  constructor(
    private readonly tags: TagRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateTagInput): Promise<Result<Tag, UpdateTagError>> {
    const tag = await this.tags.findById(input.tagId);
    if (!tag || tag.deletedAt !== null) {
      return err(new NotFoundError('Tag', input.tagId));
    }
    if (tag.ownerId !== input.ownerId) {
      return err(new AccessDeniedError('Tag'));
    }

    let name: TagName | undefined;
    if (input.name !== undefined) {
      const parsedName = createTagName(input.name);
      if (!parsedName.ok) {
        return parsedName;
      }
      name = parsedName.value;
    }

    let color: TagColor | undefined;
    if (input.color !== undefined) {
      const parsedColor = createTagColor(input.color);
      if (!parsedColor.ok) {
        return parsedColor;
      }
      color = parsedColor.value;
    }

    const updated = updateTagEntity(tag, { name, color }, this.clock.now());
    await this.tags.save(updated);
    return ok(updated);
  }
}
