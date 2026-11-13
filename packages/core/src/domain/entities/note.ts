import type { CrdtState } from '../value-objects/crdt-state';
import { emptyCrdtState } from '../value-objects/crdt-state';
import type { EncryptedBlob } from '../value-objects/encrypted-blob';
import type { NoteId, TagId, UserId } from '../value-objects/ids';
import type { NoteTitle } from '../value-objects/note-title';

interface NoteBase {
  readonly id: NoteId;
  readonly ownerId: UserId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  /** Soft-delete tombstone; needed so deletions can sync to other devices. */
  readonly deletedAt: Date | null;
}

/** Server-visible note. Content is edited through Yjs; `plainText` is a derived search/preview field. */
export interface StandardNote extends NoteBase {
  readonly kind: 'standard';
  readonly title: NoteTitle;
  readonly plainText: string;
  readonly content: CrdtState;
  readonly tagIds: readonly TagId[];
}

/**
 * Zero-knowledge note. Only the opaque encrypted blob and non-sensitive
 * metadata exist here; title/text/CRDT live INSIDE the blob.
 */
export interface VaultNote extends NoteBase {
  readonly kind: 'vault';
  readonly encryptedPayload: EncryptedBlob;
}

export type Note = StandardNote | VaultNote;

export function isStandardNote(note: Note): note is StandardNote {
  return note.kind === 'standard';
}

export function isVaultNote(note: Note): note is VaultNote {
  return note.kind === 'vault';
}

export function isDeleted(note: Note): boolean {
  return note.deletedAt !== null;
}

export function createStandardNote(params: {
  readonly id: NoteId;
  readonly ownerId: UserId;
  readonly title: NoteTitle;
  readonly tagIds?: readonly TagId[];
  readonly content?: CrdtState;
  readonly plainText?: string;
  readonly now: Date;
}): StandardNote {
  return {
    kind: 'standard',
    id: params.id,
    ownerId: params.ownerId,
    title: params.title,
    plainText: params.plainText ?? '',
    content: params.content ?? emptyCrdtState(),
    tagIds: params.tagIds ?? [],
    createdAt: params.now,
    updatedAt: params.now,
    deletedAt: null,
  };
}

export interface StandardNoteChanges {
  readonly title?: NoteTitle;
  readonly body?: { readonly content: CrdtState; readonly plainText: string };
  readonly tagIds?: readonly TagId[];
}

export function updateStandardNote(
  note: StandardNote,
  changes: StandardNoteChanges,
  now: Date,
): StandardNote {
  return {
    ...note,
    title: changes.title ?? note.title,
    content: changes.body?.content ?? note.content,
    plainText: changes.body?.plainText ?? note.plainText,
    tagIds: changes.tagIds ?? note.tagIds,
    updatedAt: now,
  };
}

export function createVaultNote(params: {
  readonly id: NoteId;
  readonly ownerId: UserId;
  readonly encryptedPayload: EncryptedBlob;
  readonly now: Date;
}): VaultNote {
  return {
    kind: 'vault',
    id: params.id,
    ownerId: params.ownerId,
    encryptedPayload: params.encryptedPayload,
    createdAt: params.now,
    updatedAt: params.now,
    deletedAt: null,
  };
}

export function replaceVaultPayload(
  note: VaultNote,
  encryptedPayload: EncryptedBlob,
  now: Date,
): VaultNote {
  return { ...note, encryptedPayload, updatedAt: now };
}

export function markNoteDeleted<T extends Note>(note: T, now: Date): T {
  return { ...note, deletedAt: now, updatedAt: now };
}
