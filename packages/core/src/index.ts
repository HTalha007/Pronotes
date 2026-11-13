export * from './types/note';
export * from './types/crypto';
export * from './crypto/crypto-engine';
export * from './storage/indexeddb';
export * from './crdt/crdt-resolver';
export * from './crdt/yjs-document-manager';
export * from './crdt/crdt-persistence-coordinator';
export * from './sync/sync-manager';

// Clean Architecture domain layer (entities, value objects, ports, use cases).
// Namespaced to avoid clashing with the legacy `types/*` exports until the
// infrastructure/UI migration is done.
export * as domain from './domain';
export * as infrastructure from './infrastructure';
