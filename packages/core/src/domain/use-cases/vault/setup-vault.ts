import { createVault, VAULT_VERIFIER_PLAINTEXT, type Vault } from '../../entities/vault';
import {
  VaultAlreadySetupError,
  type ValidationError,
  type VaultLockedError,
} from '../../errors/domain-errors';
import type { VaultRepository } from '../../repositories/vault-repository';
import type { Clock } from '../../services/platform-services';
import type { VaultCipher } from '../../services/vault-cipher';
import { utf8Encode } from '../../shared/bytes';
import { err, ok, type Result } from '../../shared/result';
import type { UserId } from '../../value-objects/ids';
import { createMasterPassword } from '../../value-objects/master-password';
import type { UseCase } from '../use-case';

export interface SetupVaultInput {
  readonly ownerId: UserId;
  readonly masterPassword: string;
}

export type SetupVaultError = ValidationError | VaultAlreadySetupError | VaultLockedError;

/**
 * First-time vault creation: validates the master password (>= 8 chars),
 * derives the key in memory (vault ends up UNLOCKED) and stores KDF params +
 * a verifier blob. The password itself is never stored. There is no recovery.
 */
export class SetupVault implements UseCase<SetupVaultInput, Result<Vault, SetupVaultError>> {
  constructor(
    private readonly vaults: VaultRepository,
    private readonly cipher: VaultCipher,
    private readonly clock: Clock,
  ) {}

  async execute(input: SetupVaultInput): Promise<Result<Vault, SetupVaultError>> {
    const password = createMasterPassword(input.masterPassword);
    if (!password.ok) {
      return password;
    }
    if ((await this.vaults.findByOwner(input.ownerId)) !== null) {
      return err(new VaultAlreadySetupError());
    }

    const kdfParams = await this.cipher.createKdfParams();
    await this.cipher.unlock(password.value, kdfParams);

    const verifier = await this.cipher.encrypt(utf8Encode(VAULT_VERIFIER_PLAINTEXT));
    if (!verifier.ok) {
      await this.cipher.lock();
      return verifier;
    }

    const vault = createVault({
      ownerId: input.ownerId,
      kdfParams,
      verifier: verifier.value,
      now: this.clock.now(),
    });
    await this.vaults.save(vault);
    return ok(vault);
  }
}
