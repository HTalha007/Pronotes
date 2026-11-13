import { createTagEntity, type Tag } from '../../entities/tag';
import type { ValidationError } from '../../errors/domain-errors';
import type { TagRepository } from '../../repositories/tag-repository';
import type { Clock, IdGenerator } from '../../services/platform-services';
import { ok, type Result } from '../../shared/result';
import type { UserId } from '../../value-objects/ids';
import { createTagColor } from '../../value-objects/tag-color';
import { createTagName } from '../../value-objects/tag-name';
import type { UseCase } from '../use-case';

export interface CreateTagInput {
  readonly ownerId: UserId;
  readonly name: string;
  readonly color?: string;
}

export class CreateTag
  implements UseCase<CreateTagInput, Result<Tag, ValidationError>>
{
  constructor(
    private readonly tags: TagRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateTagInput): Promise<Result<Tag, ValidationError>> {
    const name = createTagName(input.name);
    if (!name.ok) {
      return name;
    }
    const color = createTagColor(input.color);
    if (!color.ok) {
      return color;
    }

    const tag = createTagEntity({
      id: this.ids.newTagId(),
      ownerId: input.ownerId,
      name: name.value,
      color: color.value,
      now: this.clock.now(),
    });

    await this.tags.save(tag);
    return ok(tag);
  }
}
