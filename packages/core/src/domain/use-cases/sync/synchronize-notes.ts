import type { SyncFailedError } from '../../errors/domain-errors';
import type { ConnectivityMonitor } from '../../services/platform-services';
import type { SyncGateway, SyncReport } from '../../services/sync-gateway';
import { ok, type Result } from '../../shared/result';
import type { UserId } from '../../value-objects/ids';
import type { UseCase } from '../use-case';

export interface SynchronizeNotesInput {
  readonly ownerId: UserId;
}

export type SyncOutcome =
  | { readonly status: 'skipped-offline' }
  | { readonly status: 'synced'; readonly report: SyncReport };

/**
 * Pushes pending CRDT updates and pulls remote ones when online. Being offline
 * is NOT an error: the call resolves with `skipped-offline`, so the UI never
 * shows an alert while the user keeps writing (rule: offline-first).
 */
export class SynchronizeNotes
  implements UseCase<SynchronizeNotesInput, Result<SyncOutcome, SyncFailedError>>
{
  constructor(
    private readonly gateway: SyncGateway,
    private readonly connectivity: ConnectivityMonitor,
  ) {}

  async execute(input: SynchronizeNotesInput): Promise<Result<SyncOutcome, SyncFailedError>> {
    if (!this.connectivity.isOnline()) {
      return ok({ status: 'skipped-offline' });
    }
    const synced = await this.gateway.synchronize(input.ownerId);
    if (!synced.ok) {
      return synced;
    }
    return ok({ status: 'synced', report: synced.value });
  }
}
