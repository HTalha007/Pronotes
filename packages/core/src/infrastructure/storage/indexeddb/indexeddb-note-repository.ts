import type {
  Note,
  NoteId,
  NoteRepository,
  StandardNote,
  UserId,
  VaultNote,
} from '../../../domain';
import type { PronotesDb } from './database';
import { toDomainNote, toStoredNoteRecord } from './mappers';

export class IndexedDbNoteRepository implements NoteRepository {
  constructor(private readonly db: PronotesDb) {}

  async findById(id: NoteId): Promise<Note | null> {
    const record = await this.db.get('notes', id);
    if (!record) {
      return null;
    }
    return toDomainNote(record);
  }

  async findStandardByOwner(ownerId: UserId): Promise<readonly StandardNote[]> {
    const tx = this.db.transaction('notes', 'readonly');
    const index = tx.store.index('by-owner');
    const records = await index.getAll(ownerId);

    const notes: StandardNote[] = [];
    for (const record of records) {
      if (record.kind === 'standard' && record.deletedAt === null) {
        notes.push(toDomainNote(record) as StandardNote);
      }
    }
    return notes;
  }

  async findVaultByOwner(ownerId: UserId): Promise<readonly VaultNote[]> {
    const tx = this.db.transaction('notes', 'readonly');
    const index = tx.store.index('by-owner');
    const records = await index.getAll(ownerId);

    const notes: VaultNote[] = [];
    for (const record of records) {
      if (record.kind === 'vault' && record.deletedAt === null) {
        notes.push(toDomainNote(record) as VaultNote);
      }
    }
    return notes;
  }

  async save(note: Note): Promise<void> {
    const record = toStoredNoteRecord(note);
    await this.db.put('notes', record);
  }

  async delete(id: NoteId): Promise<void> {
    await this.db.delete('notes', id);
  }
}
