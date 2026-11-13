// ---- shared kernel ----
export * from './shared/result';
export type { Brand } from './shared/brand';
export * from './shared/bytes';
export { matchesQuery, normalizeForSearch } from './shared/text';

// ---- errors ----
export * from './errors/domain-errors';

// ---- value objects ----
export * from './value-objects/ids';
export * from './value-objects/note-title';
export * from './value-objects/tag-name';
export * from './value-objects/tag-color';
export * from './value-objects/master-password';
export * from './value-objects/credentials';
export * from './value-objects/crdt-state';
export * from './value-objects/encrypted-blob';
export * from './value-objects/kdf-params';
export * from './value-objects/vault-note-payload';

// ---- entities ----
export * from './entities/note';
export * from './entities/tag';
export * from './entities/vault';
export * from './entities/user';

// ---- ports ----
export * from './repositories/note-repository';
export * from './repositories/tag-repository';
export * from './repositories/vault-repository';
export * from './services/vault-cipher';
export * from './services/sync-gateway';
export * from './services/auth-gateway';
export * from './services/platform-services';
export * from './services/navigation-port';

// ---- use cases ----
export * from './use-cases/use-case';
export * from './use-cases/notes/create-standard-note';
export * from './use-cases/notes/update-standard-note';
export * from './use-cases/notes/delete-note';
export * from './use-cases/notes/list-notes';
export * from './use-cases/notes/search-notes';
export * from './use-cases/tags/create-tag';
export * from './use-cases/tags/list-tags';
export * from './use-cases/tags/delete-tag';
export * from './use-cases/tags/update-tag';
export * from './use-cases/vault/setup-vault';
export * from './use-cases/vault/unlock-vault';
export * from './use-cases/vault/lock-vault';
export * from './use-cases/vault/create-vault-note';
export * from './use-cases/vault/update-vault-note';
export * from './use-cases/vault/open-vault-note';
export * from './use-cases/vault/list-vault-notes';
export * from './use-cases/sync/synchronize-notes';
export * from './use-cases/auth/sign-up-and-sign-in';
export * from './use-cases/auth/sign-out';
export * from './use-cases/auth/get-current-user';
export * from './use-cases/navigation/navigate-to';
export * from './use-cases/navigation/get-current-route';
