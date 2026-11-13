import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Note } from '../types/note';

export interface PronotesDBSchema extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: {
      'by-type': string;
      'by-updated': string;
    };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      noteId: string;
      action: 'upsert' | 'delete';
      payload?: any;
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
    };
  };
  meta: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'pronotes_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PronotesDBSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<PronotesDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PronotesDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('by-type', 'type');
          notesStore.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveLocalNote(note: Note): Promise<void> {
  const db = await getDatabase();
  await db.put('notes', note);
}

export async function getLocalNote(id: string): Promise<Note | undefined> {
  const db = await getDatabase();
  return db.get('notes', id);
}

export async function getAllLocalNotes(): Promise<Note[]> {
  const db = await getDatabase();
  return db.getAll('notes');
}

export async function deleteLocalNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('notes', id);
}
