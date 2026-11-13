import type { UserId, Vault, VaultRepository } from '../../../domain';
import type { PronotesDb } from './database';
import { toDomainVault, toStoredVaultRecord } from './mappers';

export class IndexedDbVaultRepository implements VaultRepository {
  constructor(private readonly db: PronotesDb) {}

  async findByOwner(ownerId: UserId): Promise<Vault | null> {
    const record = await this.db.get('vault', ownerId);
    if (!record) {
      return null;
    }
    return toDomainVault(record);
  }

  async save(vault: Vault): Promise<void> {
    const record = toStoredVaultRecord(vault);
    await this.db.put('vault', record);
  }
}
