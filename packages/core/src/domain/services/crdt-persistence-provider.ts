import type { Clock } from './platform-services';
import type { NoteRepository } from '../repositories/note-repository';
import type { VaultCipher } from './vault-cipher';
import type { NoteId, UserId } from '../value-objects/ids';
import type { Result } from '../shared/result';
import { err, ok } from '../shared/result';
import {
  VaultLockedError,
  type DecryptionFailedError,
  type NotFoundError,
  type ValidationError,
} from '../errors/domain-errors';
import { utf8Encode } from '../shared/bytes';
import { toCrdtState } from '../value-objects/crdt-state';
import { createNoteTitle } from '../value-objects/note-title';
import { decodeVaultNotePayload, encodeVaultNotePayload } from '../value-objects/vault-note-payload';
import { replaceVaultPayload, updateStandardNote } from '../entities/note';

export interface LoadStateResult {
  readonly snapshot: Uint8Array | null;
  readonly plainText: string;
  readonly title: string;
}

export interface SaveStateInput {
  readonly ownerId: UserId;
  readonly noteId: NoteId;
  readonly snapshot: Uint8Array;
  readonly plainText: string;
  readonly title?: string;
}

export type PersistenceError =
  | NotFoundError
  | VaultLockedError
  | DecryptionFailedError
  | ValidationError;

/**
 * Port: Pluggable persistence provider for CRDT documents.
 * Standard notes persist snapshot directly to IndexedDB.
 * Vault notes encrypt snapshot with AES-256-GCM (using noteId as AAD) and never store plainText on disk.
 */
export interface NoteCrdtPersistenceProvider {
  loadInitialState(ownerId: UserId, noteId: NoteId): Promise<Result<LoadStateResult, PersistenceError>>;
  saveSnapshot(input: SaveStateInput): Promise<Result<void, PersistenceError>>;
}

export class StandardNoteCrdtPersistenceProvider implements NoteCrdtPersistenceProvider {
  constructor(
    private readonly noteRepo: NoteRepository,
    private readonly clock: Clock,
  ) {}

  async loadInitialState(
    _ownerId: UserId,
    noteId: NoteId,
  ): Promise<Result<LoadStateResult, PersistenceError>> {
    const note = await this.noteRepo.findById(noteId);
    if (!note || note.deletedAt !== null) {
      return ok({ snapshot: null, plainText: '', title: '' });
    }
    if (note.kind !== 'standard') {
      return ok({ snapshot: null, plainText: '', title: '' });
    }

    return ok({
      snapshot: note.content.length > 0 ? note.content : null,
      plainText: note.plainText,
      title: note.title,
    });
  }

  async saveSnapshot(input: SaveStateInput): Promise<Result<void, PersistenceError>> {
    const note = await this.noteRepo.findById(input.noteId);
    if (!note || note.kind !== 'standard') {
      return ok(undefined);
    }

    let title = note.title;
    if (input.title !== undefined) {
      const parsedTitle = createNoteTitle(input.title);
      if (!parsedTitle.ok) {
        return parsedTitle;
      }
      title = parsedTitle.value;
    }

    const updated = updateStandardNote(
      note,
      {
        title,
        body: {
          content: toCrdtState(input.snapshot),
          plainText: input.plainText,
        },
      },
      this.clock.now(),
    );

    await this.noteRepo.save(updated);
    return ok(undefined);
  }
}

export class VaultNoteCrdtPersistenceProvider implements NoteCrdtPersistenceProvider {
  constructor(
    private readonly noteRepo: NoteRepository,
    private readonly cipher: VaultCipher,
    private readonly clock: Clock,
  ) {}

  async loadInitialState(
    _ownerId: UserId,
    noteId: NoteId,
  ): Promise<Result<LoadStateResult, PersistenceError>> {
    const isUnlocked = await this.cipher.isUnlocked();
    if (!isUnlocked) {
      return err(new VaultLockedError());
    }

    const note = await this.noteRepo.findById(noteId);
    if (!note || note.deletedAt !== null) {
      return ok({ snapshot: null, plainText: '', title: '' });
    }
    if (note.kind !== 'vault') {
      return ok({ snapshot: null, plainText: '', title: '' });
    }

    const decrypted = await this.cipher.decrypt(note.encryptedPayload, utf8Encode(note.id));
    if (!decrypted.ok) {
      return decrypted;
    }

    const payload = decodeVaultNotePayload(decrypted.value);
    if (!payload.ok) {
      return payload;
    }

    return ok({
      snapshot: payload.value.crdtState.length > 0 ? payload.value.crdtState : null,
      plainText: payload.value.plainText,
      title: payload.value.title,
    });
  }

  async saveSnapshot(input: SaveStateInput): Promise<Result<void, PersistenceError>> {
    const isUnlocked = await this.cipher.isUnlocked();
    if (!isUnlocked) {
      return err(new VaultLockedError());
    }

    const note = await this.noteRepo.findById(input.noteId);
    if (!note || note.kind !== 'vault') {
      return ok(undefined);
    }

    const titleRes = createNoteTitle(input.title ?? '');
    if (!titleRes.ok) {
      return titleRes;
    }

    const encrypted = await this.cipher.encrypt(
      encodeVaultNotePayload({
        title: titleRes.value,
        plainText: input.plainText,
        crdtState: toCrdtState(input.snapshot),
      }),
      utf8Encode(input.noteId),
    );
    if (!encrypted.ok) {
      return encrypted;
    }

    const updated = replaceVaultPayload(note, encrypted.value, this.clock.now());
    await this.noteRepo.save(updated);
    return ok(undefined);
  }
}
