import type { Tag } from '../entities/tag';
import type { TagId, UserId } from '../value-objects/ids';

/**
 * Port: persistence of tags in local database.
 */
export interface TagRepository {
  findById(id: TagId): Promise<Tag | null>;
  findByOwner(ownerId: UserId): Promise<readonly Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: TagId): Promise<void>;
}
