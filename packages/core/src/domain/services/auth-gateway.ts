import type { AuthenticationError } from '../errors/domain-errors';
import type { User } from '../entities/user';
import type { Result } from '../shared/result';
import type { AccountPassword, Email } from '../value-objects/credentials';

/** Port: identity provider (Supabase Auth, JWT based). */
export interface AuthGateway {
  signUp(email: Email, password: AccountPassword): Promise<Result<User, AuthenticationError>>;
  signIn(email: Email, password: AccountPassword): Promise<Result<User, AuthenticationError>>;
  signOut(): Promise<void>;
  /** Restores the persisted session without network if possible. */
  getCurrentUser(): Promise<User | null>;
}
