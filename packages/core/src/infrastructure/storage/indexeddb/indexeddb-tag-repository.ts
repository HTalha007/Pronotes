import type { Tag, TagId, TagRepository, UserId } from '../../../domain';
import type { PronotesDb } from './database';
import { toDomainTag, toStoredTagRecord } from './mappers';

export class IndexedDbTagRepository implements TagRepository {
  constructor(private readonly db: PronotesDb) {}

  async findById(id: TagId): Promise<Tag | null> {
    const record = await this.db.get('tags', id);
    if (!record) {
      return null;
    }
    return toDomainTag(record);
  }

  async findByOwner(ownerId: UserId): Promise<readonly Tag[]> {
    const tx = this.db.transaction('tags', 'readonly');
    const index = tx.store.index('by-owner');
    const records = await index.getAll(ownerId);

    const tags: Tag[] = [];
    for (const record of records) {
      if (record.deletedAt === null) {
        tags.push(toDomainTag(record));
      }
    }
    return tags;
  }

  async save(tag: Tag): Promise<void> {
    const record = toStoredTagRecord(tag);
    await this.db.put('tags', record);
  }

  async delete(id: TagId): Promise<void> {
    await this.db.delete('tags', id);
  }
}
