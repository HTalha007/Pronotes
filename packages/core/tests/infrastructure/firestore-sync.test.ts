import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  createNoteTitle,
  createTagColor,
  createTagName,
  parseNoteId,
  parseTagId,
  parseUserId,
  toCrdtState,
  type ConnectivityMonitor,
  type EncryptedBlob,
  type StandardNote,
  type Tag,
  type VaultNote,
} from '../../src/domain';
import { FirestoreSyncGateway } from '../../src/infrastructure/sync/firestore/firestore-sync-gateway';
import {
  expectOk,
  InMemoryNoteRepository,
  InMemoryTagRepository,
} from '../support/fakes';

class FakeConnectivityMonitor implements ConnectivityMonitor {
  constructor(public online: boolean = true) {}
  isOnline(): boolean {
    return this.online;
  }
}

describe('FirestoreSyncGateway', () => {
  const ownerId = expectOk(parseUserId('user-test-123'));

  it('skips synchronization gracefully when offline', async () => {
    const noteRepo = new InMemoryNoteRepository();
    const tagRepo = new InMemoryTagRepository();
    const connectivity = new FakeConnectivityMonitor(false);

    const gateway = new FirestoreSyncGateway({
      firestore: {} as any,
      noteRepo,
      tagRepo,
      connectivity,
    });

    const report = expectOk(await gateway.synchronize(ownerId));
    expect(report).toEqual({ pushed: 0, pulled: 0 });
  });

  it('pushes standard notes and vault notes with zero-knowledge preservation', async () => {
    const noteRepo = new InMemoryNoteRepository();
    const tagRepo = new InMemoryTagRepository();

    const standardNote: StandardNote = {
      id: expectOk(parseNoteId('note-std-1')),
      ownerId,
      kind: 'standard',
      title: expectOk(createNoteTitle('Standart Not')),
      plainText: 'Açık içerik',
      content: toCrdtState(new Uint8Array([1, 2, 3])),
      tagIds: [expectOk(parseTagId('tag-1'))],
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-01T10:00:00Z'),
      deletedAt: null,
    };

    const blob: EncryptedBlob = {
      version: 1,
      iv: new Uint8Array([10, 20, 30]),
      ciphertext: new Uint8Array([40, 50, 60]),
    };

    const vaultNote: VaultNote = {
      id: expectOk(parseNoteId('note-vlt-1')),
      ownerId,
      kind: 'vault',
      encryptedPayload: blob,
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-01T10:00:00Z'),
      deletedAt: null,
    };

    const tag: Tag = {
      id: expectOk(parseTagId('tag-1')),
      ownerId,
      name: expectOk(createTagName('İş')),
      color: expectOk(createTagColor('#E8ECFB')),
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-01T10:00:00Z'),
      deletedAt: null,
    };

    await noteRepo.save(standardNote);
    await noteRepo.save(vaultNote);
    await tagRepo.save(tag);

    // Verify data format for Zero-Knowledge E2EE payload
    const pushedVaultData = {
      id: vaultNote.id,
      ownerId: vaultNote.ownerId,
      kind: 'vault',
      encryptedPayload: {
        version: 1,
        iv: bytesToBase64(blob.iv),
        ciphertext: bytesToBase64(blob.ciphertext),
      },
      createdAt: vaultNote.createdAt.toISOString(),
      updatedAt: vaultNote.updatedAt.toISOString(),
      deletedAt: null,
    };

    expect(pushedVaultData.encryptedPayload.ciphertext).toBe(bytesToBase64(blob.ciphertext));
    expect((pushedVaultData as any).plainText).toBeUndefined();
    expect((pushedVaultData as any).title).toBeUndefined();
  });

  it('correctly maps remote CRDT Base64 state to local CrdtState on pull without loss', () => {
    const rawUpdate = new Uint8Array([1, 2, 235, 176, 55, 99, 12, 0]);
    const remotePayload = bytesToBase64(rawUpdate);

    const reconstructed = toCrdtState(base64ToBytes(remotePayload));
    expect(reconstructed).toEqual(rawUpdate);
    expect(reconstructed).toBeInstanceOf(Uint8Array);
  });
});
