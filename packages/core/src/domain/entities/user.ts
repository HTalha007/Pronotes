import type { Email } from '../value-objects/credentials';
import type { UserId } from '../value-objects/ids';

export interface User {
  readonly id: UserId;
  readonly email: Email;
}
