import type { User } from '../../entities/user';
import type { AuthGateway } from '../../services/auth-gateway';
import { ok, type Result } from '../../shared/result';
import type { UseCase } from '../use-case';

/** Restores the persisted session on app start (works offline). `null` = signed out. */
export class GetCurrentUser implements UseCase<void, Result<User | null, never>> {
  constructor(private readonly auth: AuthGateway) {}

  async execute(): Promise<Result<User | null, never>> {
    return ok(await this.auth.getCurrentUser());
  }
}
