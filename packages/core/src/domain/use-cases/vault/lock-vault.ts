import type { VaultCipher } from '../../services/vault-cipher';
import { ok, type Result } from '../../shared/result';
import type { UseCase } from '../use-case';

/** Wipes the in-memory vault key (manual lock, auto-lock, sign-out). */
export class LockVault implements UseCase<void, Result<void, never>> {
  constructor(private readonly cipher: VaultCipher) {}

  async execute(): Promise<Result<void, never>> {
    await this.cipher.lock();
    return ok(undefined);
  }
}
