import type { User } from '../../entities/user';
import type { AuthenticationError, ValidationError } from '../../errors/domain-errors';
import type { AuthGateway } from '../../services/auth-gateway';
import type { Result } from '../../shared/result';
import { createAccountPassword, createEmail } from '../../value-objects/credentials';
import type { UseCase } from '../use-case';

export interface CredentialsInput {
  readonly email: string;
  readonly password: string;
}

export type CredentialsError = ValidationError | AuthenticationError;

export class SignUp implements UseCase<CredentialsInput, Result<User, CredentialsError>> {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: CredentialsInput): Promise<Result<User, CredentialsError>> {
    const email = createEmail(input.email);
    if (!email.ok) {
      return email;
    }
    const password = createAccountPassword(input.password);
    if (!password.ok) {
      return password;
    }
    return this.auth.signUp(email.value, password.value);
  }
}

export class SignIn implements UseCase<CredentialsInput, Result<User, CredentialsError>> {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: CredentialsInput): Promise<Result<User, CredentialsError>> {
    const email = createEmail(input.email);
    if (!email.ok) {
      return email;
    }
    const password = createAccountPassword(input.password);
    if (!password.ok) {
      return password;
    }
    return this.auth.signIn(email.value, password.value);
  }
}
