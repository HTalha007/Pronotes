import type { Vault } from '../entities/vault';
import type { UserId } from '../value-objects/ids';

/** Port: persistence of the (non-secret) vault configuration. */
export interface VaultRepository {
  findByOwner(ownerId: UserId): Promise<Vault | null>;
  save(vault: Vault): Promise<void>;
}
