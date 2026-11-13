import type { AuthGateway } from '../../services/auth-gateway';
import type { VaultCipher } from '../../services/vault-cipher';
import { ok, type Result } from '../../shared/result';
import type { UseCase } from '../use-case';

/**
 * Ends the session AND wipes the vault key from memory ("keys are erased when
 * the session closes"). The vault is locked first so a failing network call
 * can never leave a key behind.
 */
export class SignOut implements UseCase<void, Result<void, never>> {
  constructor(
    private readonly auth: AuthGateway,
    private readonly cipher: VaultCipher,
  ) {}

  async execute(): Promise<Result<void, never>> {
    await this.cipher.lock();
    await this.auth.signOut();
    return ok(undefined);
  }
}
