import type { Note, StandardNote, VaultNote } from '../entities/note';
import type { NoteId, UserId } from '../value-objects/ids';

/**
 * Port: local-first note persistence (implemented over IndexedDB / y-indexeddb
 * in infrastructure). All reads/writes hit local storage first.
 */
export interface NoteRepository {
  /** Returns the note even if soft-deleted, or `null` when unknown. */
  findById(id: NoteId): Promise<Note | null>;
  /** Non-deleted standard notes of the owner (unsorted). */
  findStandardByOwner(ownerId: UserId): Promise<readonly StandardNote[]>;
  /** Non-deleted vault notes of the owner (encrypted, unsorted). */
  findVaultByOwner(ownerId: UserId): Promise<readonly VaultNote[]>;
  /** Insert or update. Must be durable locally before resolving. */
  save(note: Note): Promise<void>;
}
