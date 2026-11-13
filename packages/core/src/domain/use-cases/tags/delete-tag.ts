import { markTagDeleted } from '../../entities/tag';
import { AccessDeniedError, NotFoundError } from '../../errors/domain-errors';
import type { TagRepository } from '../../repositories/tag-repository';
import type { Clock } from '../../services/platform-services';
import { err, ok, type Result } from '../../shared/result';
import type { TagId, UserId } from '../../value-objects/ids';
import type { UseCase } from '../use-case';

export interface DeleteTagInput {
  readonly ownerId: UserId;
  readonly tagId: TagId;
}

export type DeleteTagError = NotFoundError | AccessDeniedError;

export class DeleteTag
  implements UseCase<DeleteTagInput, Result<void, DeleteTagError>>
{
  constructor(
    private readonly tags: TagRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeleteTagInput): Promise<Result<void, DeleteTagError>> {
    const tag = await this.tags.findById(input.tagId);
    if (!tag || tag.deletedAt !== null) {
      return err(new NotFoundError('Tag', input.tagId));
    }
    if (tag.ownerId !== input.ownerId) {
      return err(new AccessDeniedError('Tag'));
    }

    const deleted = markTagDeleted(tag, this.clock.now());
    await this.tags.save(deleted);
    return ok(undefined);
  }
}
