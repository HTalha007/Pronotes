import { VAULT_VERIFIER_PLAINTEXT } from '../../entities/vault';
import { InvalidMasterPasswordError, VaultNotSetupError } from '../../errors/domain-errors';
import type { VaultRepository } from '../../repositories/vault-repository';
import type { VaultCipher } from '../../services/vault-cipher';
import { utf8Decode } from '../../shared/bytes';
import { err, ok, type Result } from '../../shared/result';
import type { UserId } from '../../value-objects/ids';
import { createMasterPassword } from '../../value-objects/master-password';
import type { UseCase } from '../use-case';

export interface UnlockVaultInput {
  readonly ownerId: UserId;
  readonly masterPassword: string;
}

/**
 * Unlocks the vault WITHOUT asking the server: the key is derived locally and
 * proven by decrypting the verifier blob. A wrong password is detected by the
 * AES-GCM authentication tag and reported as InvalidMasterPasswordError
 * ("Şifre Yanlış"); the in-memory key is wiped again.
 */
export class UnlockVault
  implements UseCase<UnlockVaultInput, Result<void, VaultNotSetupError | InvalidMasterPasswordError>>
{
  constructor(
    private readonly vaults: VaultRepository,
    private readonly cipher: VaultCipher,
  ) {}

  async execute(
    input: UnlockVaultInput,
  ): Promise<Result<void, VaultNotSetupError | InvalidMasterPasswordError>> {
    const vault = await this.vaults.findByOwner(input.ownerId);
    if (vault === null) {
      return err(new VaultNotSetupError());
    }

    // Do not expose the password policy on unlock: anything invalid is just "wrong".
    const password = createMasterPassword(input.masterPassword);
    if (!password.ok) {
      return err(new InvalidMasterPasswordError());
    }

    await this.cipher.unlock(password.value, vault.kdfParams);
    const check = await this.cipher.decrypt(vault.verifier);
    if (!check.ok || utf8Decode(check.value) !== VAULT_VERIFIER_PLAINTEXT) {
      await this.cipher.lock();
      return err(new InvalidMasterPasswordError());
    }
    return ok(undefined);
  }
}
