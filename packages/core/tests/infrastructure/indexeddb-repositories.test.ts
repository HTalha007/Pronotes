import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import {
  createEncryptedBlob,
  createKdfParams,
  createNoteTitle,
  createStandardNote,
  createTagColor,
  createTagEntity,
  createTagName,
  createVault,
  createVaultNote,
  markNoteDeleted,
  markTagDeleted,
  parseNoteId,
  parseTagId,
  parseUserId,
  toCrdtState,
  type StandardNote,
  type Tag,
  type VaultNote,
} from '../../src/domain';
import {
  clearDatabase,
  IndexedDbNoteRepository,
  IndexedDbTagRepository,
  IndexedDbVaultRepository,
  openPronotesDb,
  type PronotesDb,
} from '../../src/infrastructure';
import { expectOk } from '../support/fakes';

const USER_1 = expectOk(parseUserId('user-1'));
const USER_2 = expectOk(parseUserId('user-2'));

describe('IndexedDB Local Database and Repositories (Integration)', () => {
  let db: PronotesDb;
  let noteRepo: IndexedDbNoteRepository;
  let tagRepo: IndexedDbTagRepository;
  let vaultRepo: IndexedDbVaultRepository;

  beforeEach(async () => {
    // Open a test database and ensure it starts completely empty
    db = await openPronotesDb({ name: `test_db_${Date.now()}_${Math.random()}` });
    await clearDatabase(db);

    noteRepo = new IndexedDbNoteRepository(db);
    tagRepo = new IndexedDbTagRepository(db);
    vaultRepo = new IndexedDbVaultRepository(db);
  });

  it('starts completely empty (0 notes, 0 tags, no vault)', async () => {
    const standardNotes = await noteRepo.findStandardByOwner(USER_1);
    const vaultNotes = await noteRepo.findVaultByOwner(USER_1);
    const tags = await tagRepo.findByOwner(USER_1);
    const vault = await vaultRepo.findByOwner(USER_1);

    expect(standardNotes).toHaveLength(0);
    expect(vaultNotes).toHaveLength(0);
    expect(tags).toHaveLength(0);
    expect(vault).toBeNull();
  });

  describe('IndexedDbTagRepository write & delete', () => {
    it('saves a tag and retrieves it by id and owner', async () => {
      const tag: Tag = createTagEntity({
        id: expectOk(parseTagId('tag-1')),
        ownerId: USER_1,
        name: expectOk(createTagName('Kişisel')),
        color: expectOk(createTagColor('#3D7A5F')),
        now: new Date('2026-02-01T10:00:00Z'),
      });

      await tagRepo.save(tag);

      const byId = await tagRepo.findById(tag.id);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(tag.id);
      expect(byId?.name).toBe('Kişisel');
      expect(byId?.color).toBe('#3D7A5F');
      expect(byId?.createdAt).toEqual(new Date('2026-02-01T10:00:00Z'));

      const list = await tagRepo.findByOwner(USER_1);
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe(tag.id);
    });

    it('isolates tags between different users', async () => {
      const tag1 = createTagEntity({
        id: expectOk(parseTagId('tag-1')),
        ownerId: USER_1,
        name: expectOk(createTagName('User1 Tag')),
        color: expectOk(createTagColor()),
        now: new Date(),
      });
      const tag2 = createTagEntity({
        id: expectOk(parseTagId('tag-2')),
        ownerId: USER_2,
        name: expectOk(createTagName('User2 Tag')),
        color: expectOk(createTagColor()),
        now: new Date(),
      });

      await tagRepo.save(tag1);
      await tagRepo.save(tag2);

      const user1Tags = await tagRepo.findByOwner(USER_1);
      expect(user1Tags).toHaveLength(1);
      expect(user1Tags[0]?.id).toBe(tag1.id);

      const user2Tags = await tagRepo.findByOwner(USER_2);
      expect(user2Tags).toHaveLength(1);
      expect(user2Tags[0]?.id).toBe(tag2.id);
    });

    it('deletes a tag from the database', async () => {
      const tag = createTagEntity({
        id: expectOk(parseTagId('tag-del')),
        ownerId: USER_1,
        name: expectOk(createTagName('Silinecek')),
        color: expectOk(createTagColor()),
        now: new Date(),
      });

      await tagRepo.save(tag);
      expect(await tagRepo.findById(tag.id)).not.toBeNull();

      // Physical delete
      await tagRepo.delete(tag.id);
      expect(await tagRepo.findById(tag.id)).toBeNull();
      expect(await tagRepo.findByOwner(USER_1)).toHaveLength(0);
    });

    it('filters out soft-deleted tags from findByOwner', async () => {
      const tag = createTagEntity({
        id: expectOk(parseTagId('tag-soft')),
        ownerId: USER_1,
        name: expectOk(createTagName('Soft Del')),
        color: expectOk(createTagColor()),
        now: new Date(),
      });

      await tagRepo.save(tag);
      const softDeleted = markTagDeleted(tag, new Date());
      await tagRepo.save(softDeleted);

      // findById returns it with deletedAt
      const byId = await tagRepo.findById(tag.id);
      expect(byId?.deletedAt).not.toBeNull();

      // findByOwner excludes soft-deleted
      const list = await tagRepo.findByOwner(USER_1);
      expect(list).toHaveLength(0);
    });
  });

  describe('IndexedDbNoteRepository write & delete', () => {
    it('saves a standard note with tags and retrieves it', async () => {
      const note: StandardNote = {
        kind: 'standard',
        id: expectOk(parseNoteId('note-1')),
        ownerId: USER_1,
        title: expectOk(createNoteTitle('Test Notu')),
        plainText: 'içerik metni',
        content: toCrdtState(new Uint8Array([1, 2, 3])),
        tagIds: [expectOk(parseTagId('tag-1'))],
        createdAt: new Date('2026-03-01T12:00:00Z'),
        updatedAt: new Date('2026-03-01T12:00:00Z'),
        deletedAt: null,
      };

      await noteRepo.save(note);

      const byId = await noteRepo.findById(note.id);
      expect(byId).not.toBeNull();
      expect(byId?.kind).toBe('standard');
      if (byId?.kind === 'standard') {
        expect(byId.title).toBe('Test Notu');
        expect(byId.plainText).toBe('içerik metni');
        expect(byId.tagIds).toEqual([expectOk(parseTagId('tag-1'))]);
        expect([...byId.content]).toEqual([1, 2, 3]);
      }

      const list = await noteRepo.findStandardByOwner(USER_1);
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe(note.id);
    });

    it('saves a vault note with encrypted blob and retrieves it', async () => {
      const blob = expectOk(
        createEncryptedBlob(
          new Uint8Array(12).fill(1),
          new Uint8Array(32).fill(2),
        ),
      );

      const vaultNote: VaultNote = createVaultNote({
        id: expectOk(parseNoteId('vault-note-1')),
        ownerId: USER_1,
        encryptedPayload: blob,
        now: new Date(),
      });

      await noteRepo.save(vaultNote);

      const byId = await noteRepo.findById(vaultNote.id);
      expect(byId).not.toBeNull();
      expect(byId?.kind).toBe('vault');
      if (byId?.kind === 'vault') {
        expect([...byId.encryptedPayload.iv]).toEqual([...blob.iv]);
        expect([...byId.encryptedPayload.ciphertext]).toEqual([...blob.ciphertext]);
      }

      const vaultList = await noteRepo.findVaultByOwner(USER_1);
      expect(vaultList).toHaveLength(1);
      expect(vaultList[0]?.id).toBe(vaultNote.id);
    });

    it('soft-deletes a note and verifies it is excluded from list', async () => {
      const note = createStandardNote({
        id: expectOk(parseNoteId('note-del')),
        ownerId: USER_1,
        title: expectOk(createNoteTitle('Silinecek Not')),
        now: new Date(),
      });

      await noteRepo.save(note);
      expect(await noteRepo.findStandardByOwner(USER_1)).toHaveLength(1);

      const deleted = markNoteDeleted(note, new Date());
      await noteRepo.save(deleted);

      // Still retrievable by ID with deletedAt
      const byId = await noteRepo.findById(note.id);
      expect(byId?.deletedAt).not.toBeNull();

      // Excluded from findStandardByOwner
      expect(await noteRepo.findStandardByOwner(USER_1)).toHaveLength(0);
    });

    it('physically deletes a note via delete method', async () => {
      const note = createStandardNote({
        id: expectOk(parseNoteId('note-hard-del')),
        ownerId: USER_1,
        title: expectOk(createNoteTitle('Tamamen Sil')),
        now: new Date(),
      });

      await noteRepo.save(note);
      expect(await noteRepo.findById(note.id)).not.toBeNull();

      await noteRepo.delete(note.id);
      expect(await noteRepo.findById(note.id)).toBeNull();
    });
  });

  describe('IndexedDbVaultRepository', () => {
    it('saves and retrieves vault configuration for a user', async () => {
      const kdf = expectOk(createKdfParams(100_000, new Uint8Array(16).fill(9)));
      const verifier = expectOk(
        createEncryptedBlob(
          new Uint8Array(12).fill(3),
          new Uint8Array(32).fill(4),
        ),
      );

      const vault = createVault({
        ownerId: USER_1,
        kdfParams: kdf,
        verifier,
        now: new Date('2026-01-01T00:00:00Z'),
      });

      await vaultRepo.save(vault);

      const loaded = await vaultRepo.findByOwner(USER_1);
      expect(loaded).not.toBeNull();
      expect(loaded?.ownerId).toBe(USER_1);
      expect(loaded?.kdfParams.iterations).toBe(100_000);
      expect([...loaded!.kdfParams.salt]).toEqual([...kdf.salt]);
      expect([...loaded!.verifier.iv]).toEqual([...verifier.iv]);
      expect([...loaded!.verifier.ciphertext]).toEqual([...verifier.ciphertext]);
    });
  });
});
