import type { SyncFailedError } from '../errors/domain-errors';
import type { Result } from '../shared/result';
import type { UserId } from '../value-objects/ids';

export interface SyncReport {
  readonly pushed: number;
  readonly pulled: number;
}

/**
 * Port: background CRDT synchronisation with the backend (Hocuspocus /
 * Supabase Realtime). The server is a dumb relay; for vault notes it only
 * ever receives encrypted blobs. Implementations must be idempotent so a
 * reconnect never produces duplicate writes.
 */
export interface SyncGateway {
  synchronize(ownerId: UserId): Promise<Result<SyncReport, SyncFailedError>>;
}
