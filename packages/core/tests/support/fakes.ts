import {
  createKdfParams,
  DecryptionFailedError,
  parseNoteId,
  parseTagId,
  VaultLockedError,
  type AccountPassword,
  type AuthGateway,
  type Clock,
  type ConnectivityMonitor,
  type Email,
  type EncryptedBlob,
  type IdGenerator,
  type KdfParams,
  type MasterPassword,
  type Note,
  type NoteId,
  type NoteRepository,
  type Result,
  type StandardNote,
  type SyncGateway,
  type SyncReport,
  type Tag,
  type TagId,
  type TagRepository,
  type User,
  type UserId,
  type Vault,
  type VaultCipher,
  type VaultNote,
  type VaultRepository,
  type AppRoute,
  type NavigationPort,
  AuthenticationError,
  SyncFailedError,
  err,
  ok,
} from '../../src/domain';

export function expectOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw new Error(`Expected ok result but got error: ${String(result.error)}`);
  }
  return result.value;
}

export function expectErr<T, E>(result: Result<T, E>): E {
  if (result.ok) {
    throw new Error('Expected error result but got ok.');
  }
  return result.error;
}

export class InMemoryNoteRepository implements NoteRepository {
  readonly store = new Map<string, Note>();

  async findById(id: NoteId): Promise<Note | null> {
    return this.store.get(id) ?? null;
  }

  async findStandardByOwner(ownerId: UserId): Promise<readonly StandardNote[]> {
    return [...this.store.values()].filter(
      (n): n is StandardNote => n.kind === 'standard' && n.ownerId === ownerId && n.deletedAt === null,
    );
  }

  async findVaultByOwner(ownerId: UserId): Promise<readonly VaultNote[]> {
    return [...this.store.values()].filter(
      (n): n is VaultNote => n.kind === 'vault' && n.ownerId === ownerId && n.deletedAt === null,
    );
  }

  async save(note: Note): Promise<void> {
    this.store.set(note.id, note);
  }
}

export class InMemoryVaultRepository implements VaultRepository {
  readonly store = new Map<string, Vault>();

  async findByOwner(ownerId: UserId): Promise<Vault | null> {
    return this.store.get(ownerId) ?? null;
  }

  async save(vault: Vault): Promise<void> {
    this.store.set(vault.ownerId, vault);
  }
}

export class InMemoryTagRepository implements TagRepository {
  readonly store = new Map<string, Tag>();

  async findById(id: TagId): Promise<Tag | null> {
    return this.store.get(id) ?? null;
  }

  async findByOwner(ownerId: UserId): Promise<readonly Tag[]> {
    return [...this.store.values()].filter(
      (t) => t.ownerId === ownerId && t.deletedAt === null,
    );
  }

  async save(tag: Tag): Promise<void> {
    this.store.set(tag.id, tag);
  }

  async delete(id: TagId): Promise<void> {
    this.store.delete(id);
  }
}

export class FakeClock implements Clock {
  private current = new Date('2026-01-01T00:00:00.000Z');

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;
  private tagCounter = 0;

  newNoteId(): NoteId {
    this.counter += 1;
    return expectOk(parseNoteId(`note-${this.counter}`));
  }

  newTagId(): TagId {
    this.tagCounter += 1;
    return expectOk(parseTagId(`tag-${this.tagCounter}`));
  }
}

export class FakeConnectivity implements ConnectivityMonitor {
  constructor(public online = true) {}

  isOnline(): boolean {
    return this.online;
  }
}

const TAG_LENGTH = 16;

/**
 * Reversible stand-in for AES-GCM: XOR with the key plus a key-derived
 * "tag", so a wrong key fails authentication exactly like the real thing.
 */
export class FakeVaultCipher implements VaultCipher {
  private key: Uint8Array | null = null;
  readonly calls: string[] = [];

  get unlocked(): boolean {
    return this.key !== null;
  }

  async createKdfParams(): Promise<KdfParams> {
    const params = createKdfParams(100_000, new Uint8Array(16).fill(7));
    if (!params.ok) {
      throw params.error;
    }
    return params.value;
  }

  async unlock(password: MasterPassword, _params: KdfParams): Promise<void> {
    this.calls.push('unlock');
    this.key = new TextEncoder().encode(password);
  }

  async lock(): Promise<void> {
    this.calls.push('lock');
    this.key = null;
  }

  async isUnlocked(): Promise<boolean> {
    return this.key !== null;
  }

  async encrypt(plaintext: Uint8Array): Promise<Result<EncryptedBlob, VaultLockedError>> {
    if (this.key === null) {
      return err(new VaultLockedError());
    }
    const ciphertext = new Uint8Array(plaintext.length + TAG_LENGTH);
    plaintext.forEach((byte, i) => {
      ciphertext[i] = byte ^ (this.key?.[i % (this.key?.length ?? 1)] ?? 0);
    });
    ciphertext.set(this.tag(this.key), plaintext.length);
    return ok({ version: 1, iv: new Uint8Array(12), ciphertext });
  }

  async decrypt(
    blob: EncryptedBlob,
  ): Promise<Result<Uint8Array, VaultLockedError | DecryptionFailedError>> {
    if (this.key === null) {
      return err(new VaultLockedError());
    }
    const dataLength = blob.ciphertext.length - TAG_LENGTH;
    const expectedTag = this.tag(this.key);
    const actualTag = blob.ciphertext.slice(dataLength);
    if (dataLength < 0 || expectedTag.some((byte, i) => byte !== actualTag[i])) {
      return err(new DecryptionFailedError());
    }
    const plaintext = new Uint8Array(dataLength);
    for (let i = 0; i < dataLength; i += 1) {
      plaintext[i] = (blob.ciphertext[i] ?? 0) ^ (this.key[i % this.key.length] ?? 0);
    }
    return ok(plaintext);
  }

  private tag(key: Uint8Array): Uint8Array {
    return Uint8Array.from({ length: TAG_LENGTH }, (_, i) => (key[i % key.length] ?? 0) ^ 0x5a);
  }
}

export class FakeSyncGateway implements SyncGateway {
  calls = 0;
  result: Result<SyncReport, SyncFailedError> = ok({ pushed: 2, pulled: 1 });

  async synchronize(_ownerId: UserId): Promise<Result<SyncReport, SyncFailedError>> {
    this.calls += 1;
    return this.result;
  }
}

export class FakeAuthGateway implements AuthGateway {
  readonly calls: string[] = [];
  user: User | null = null;

  constructor(private readonly knownUser: User) {}

  async signUp(_email: Email, _password: AccountPassword): Promise<Result<User, AuthenticationError>> {
    this.calls.push('signUp');
    this.user = this.knownUser;
    return ok(this.knownUser);
  }

  async signIn(_email: Email, password: AccountPassword): Promise<Result<User, AuthenticationError>> {
    this.calls.push('signIn');
    if (password !== 'correct-password') {
      return err(new AuthenticationError('invalid-credentials'));
    }
    this.user = this.knownUser;
    return ok(this.knownUser);
  }

  async signOut(): Promise<void> {
    this.calls.push('signOut');
    this.user = null;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.user;
  }
}

export class FakeNavigationAdapter implements NavigationPort {
  private current: AppRoute = { kind: 'all-notes' };
  private listeners: ((route: AppRoute) => void)[] = [];
  readonly history: AppRoute[] = [{ kind: 'all-notes' }];

  getCurrentRoute(): AppRoute {
    return this.current;
  }

  navigateTo(route: AppRoute): void {
    this.current = route;
    this.history.push(route);
    this.listeners.forEach((l) => l(route));
  }

  subscribe(listener: (route: AppRoute) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
