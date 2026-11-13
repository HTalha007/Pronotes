import { openDB, type IDBPDatabase } from 'idb';
import type { PronotesDbSchema } from './schema';

export type PronotesDb = IDBPDatabase<PronotesDbSchema>;

export const DEFAULT_DB_NAME = 'pronotes_db';
export const DB_VERSION = 1;

export interface OpenDbOptions {
  name?: string;
  indexedDB?: IDBFactory;
}

/**
 * Opens (and migrates) the local IndexedDB database.
 * The database starts completely empty (0 records); no dummy/mock data is inserted.
 */
export async function openPronotesDb(options?: OpenDbOptions): Promise<PronotesDb> {
  const dbName = options?.name ?? DEFAULT_DB_NAME;

  return openDB<PronotesDbSchema>(dbName, DB_VERSION, {
    upgrade(db) {
      // 1. notes store
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('by-owner', 'ownerId');
        notesStore.createIndex('by-kind', 'kind');
        notesStore.createIndex('by-updated', 'updatedAt');
      }

      // 2. tags store
      if (!db.objectStoreNames.contains('tags')) {
        const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
        tagsStore.createIndex('by-owner', 'ownerId');
        tagsStore.createIndex('by-name', 'name');
      }

      // 3. vault store
      if (!db.objectStoreNames.contains('vault')) {
        const vaultStore = db.createObjectStore('vault', { keyPath: 'ownerId' });
        vaultStore.createIndex('by-owner', 'ownerId');
      }
    },
    // Allows passing fake-indexeddb factory in test environments
    // @ts-expect-error idb options support custom indexedDB factory in browsers/node
    indexedDB: options?.indexedDB,
  });
}

/**
 * Clears all data from all stores (useful for tests or complete account logout).
 */
export async function clearDatabase(db: PronotesDb): Promise<void> {
  const tx = db.transaction(['notes', 'tags', 'vault'], 'readwrite');
  await Promise.all([
    tx.objectStore('notes').clear(),
    tx.objectStore('tags').clear(),
    tx.objectStore('vault').clear(),
    tx.done,
  ]);
}
