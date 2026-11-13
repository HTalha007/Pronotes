import {
  createEncryptedBlob,
  createKdfParams,
  createNoteTitle,
  createTagColor,
  createTagName,
  createVault,
  parseNoteId,
  parseTagId,
  parseUserId,
  toCrdtState,
  type Note,
  type NoteTitle,
  type StandardNote,
  type Tag,
  type TagColor,
  type TagId,
  type Vault,
  type VaultNote,
} from '../../../domain';
import type {
  StoredNoteRecord,
  StoredStandardNoteRecord,
  StoredTagRecord,
  StoredVaultNoteRecord,
  StoredVaultRecord,
} from './schema';

// --- Note Mappers ---

export function toStoredNoteRecord(note: Note): StoredNoteRecord {
  const common = {
    id: note.id,
    ownerId: note.ownerId,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
    deletedAt: note.deletedAt ? note.deletedAt.getTime() : null,
  };

  if (note.kind === 'standard') {
    const standard: StoredStandardNoteRecord = {
      ...common,
      kind: 'standard',
      title: note.title,
      plainText: note.plainText,
      content: new Uint8Array(note.content),
      tagIds: [...note.tagIds],
    };
    return standard;
  }

  const vault: StoredVaultNoteRecord = {
    ...common,
    kind: 'vault',
    iv: new Uint8Array(note.encryptedPayload.iv),
    ciphertext: new Uint8Array(note.encryptedPayload.ciphertext),
    version: 1,
  };
  return vault;
}

export function toDomainNote(record: StoredNoteRecord): Note {
  const noteId = parseNoteId(record.id);
  const ownerId = parseUserId(record.ownerId);

  if (!noteId.ok || !ownerId.ok) {
    throw new Error(`Corrupted note record ID: ${record.id}`);
  }

  const createdAt = new Date(record.createdAt);
  const updatedAt = new Date(record.updatedAt);
  const deletedAt = record.deletedAt ? new Date(record.deletedAt) : null;

  if (record.kind === 'standard') {
    const titleRes = createNoteTitle(record.title);
    const title: NoteTitle = titleRes.ok ? titleRes.value : ('' as NoteTitle);
    const tagIds: TagId[] = (record.tagIds || [])
      .map((tId) => parseTagId(tId))
      .filter((r): r is { ok: true; value: TagId } => r.ok)
      .map((r) => r.value);

    const standard: StandardNote = {
      kind: 'standard',
      id: noteId.value,
      ownerId: ownerId.value,
      title,
      plainText: record.plainText,
      content: toCrdtState(new Uint8Array(record.content)),
      tagIds,
      createdAt,
      updatedAt,
      deletedAt,
    };
    return standard;
  }

  const blobRes = createEncryptedBlob(
    new Uint8Array(record.iv),
    new Uint8Array(record.ciphertext),
  );
  if (!blobRes.ok) {
    throw new Error(`Corrupted encrypted blob in note: ${record.id}`);
  }

  const vault: VaultNote = {
    kind: 'vault',
    id: noteId.value,
    ownerId: ownerId.value,
    encryptedPayload: blobRes.value,
    createdAt,
    updatedAt,
    deletedAt,
  };
  return vault;
}

// --- Tag Mappers ---

export function toStoredTagRecord(tag: Tag): StoredTagRecord {
  return {
    id: tag.id,
    ownerId: tag.ownerId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.getTime(),
    updatedAt: tag.updatedAt.getTime(),
    deletedAt: tag.deletedAt ? tag.deletedAt.getTime() : null,
  };
}

export function toDomainTag(record: StoredTagRecord): Tag {
  const tagId = parseTagId(record.id);
  const ownerId = parseUserId(record.ownerId);
  const nameRes = createTagName(record.name);
  const colorRes = createTagColor(record.color);

  if (!tagId.ok || !ownerId.ok || !nameRes.ok) {
    throw new Error(`Corrupted tag record: ${record.id}`);
  }

  const color: TagColor = colorRes.ok ? colorRes.value : ('#E8ECFB' as TagColor);

  return {
    id: tagId.value,
    ownerId: ownerId.value,
    name: nameRes.value,
    color,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
  };
}

// --- Vault Mappers ---

export function toStoredVaultRecord(vault: Vault): StoredVaultRecord {
  return {
    ownerId: vault.ownerId,
    kdfAlgorithm: vault.kdfParams.algorithm,
    kdfHash: vault.kdfParams.hash,
    kdfIterations: vault.kdfParams.iterations,
    kdfSalt: new Uint8Array(vault.kdfParams.salt),
    verifierIv: new Uint8Array(vault.verifier.iv),
    verifierCiphertext: new Uint8Array(vault.verifier.ciphertext),
    verifierVersion: 1,
    createdAt: vault.createdAt.getTime(),
  };
}

export function toDomainVault(record: StoredVaultRecord): Vault {
  const ownerId = parseUserId(record.ownerId);
  if (!ownerId.ok) {
    throw new Error(`Corrupted vault ownerId: ${record.ownerId}`);
  }

  const kdfParamsRes = createKdfParams(record.kdfIterations, new Uint8Array(record.kdfSalt));
  if (!kdfParamsRes.ok) {
    throw new Error(`Corrupted KDF params in vault for ${record.ownerId}`);
  }

  const verifierRes = createEncryptedBlob(
    new Uint8Array(record.verifierIv),
    new Uint8Array(record.verifierCiphertext),
  );
  if (!verifierRes.ok) {
    throw new Error(`Corrupted verifier in vault for ${record.ownerId}`);
  }

  return createVault({
    ownerId: ownerId.value,
    kdfParams: kdfParamsRes.value,
    verifier: verifierRes.value,
    now: new Date(record.createdAt),
  });
}
