import type { Tag } from '../../entities/tag';
import type { TagRepository } from '../../repositories/tag-repository';
import { ok, type Result } from '../../shared/result';
import type { UserId } from '../../value-objects/ids';
import type { UseCase } from '../use-case';

export interface ListTagsInput {
  readonly ownerId: UserId;
}

export class ListTags
  implements UseCase<ListTagsInput, Result<readonly Tag[], never>>
{
  constructor(private readonly tags: TagRepository) {}

  async execute(input: ListTagsInput): Promise<Result<readonly Tag[], never>> {
    const list = await this.tags.findByOwner(input.ownerId);
    const nonDeleted = list.filter((t) => t.deletedAt === null);
    return ok([...nonDeleted].sort((a, b) => a.name.localeCompare(b.name)));
  }
}
