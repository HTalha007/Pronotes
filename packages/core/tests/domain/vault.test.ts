import { describe, expect, it } from 'vitest';
import {
  createMasterPassword,
  StandardNoteCrdtPersistenceProvider,
  toCrdtState,
  utf8Decode,
  VaultNoteCrdtPersistenceProvider,
  VAULT_VERIFIER_PLAINTEXT,
} from '../../src/domain';
import { expectErr, expectOk, FakeVaultCipher } from '../support/fakes';
import { createWorld, MASTER_PASSWORD, OTHER_USER, OWNER } from '../support/world';

const crdt = toCrdtState(Uint8Array.from([9, 8, 7]));

async function worldWithUnlockedVault() {
  const world = createWorld();
  expectOk(await world.setupVault.execute({ ownerId: OWNER, masterPassword: MASTER_PASSWORD }));
  return world;
}

describe('vault setup & unlock', () => {
  it('rejects master passwords shorter than 8 characters', async () => {
    const world = createWorld();
    const error = expectErr(await world.setupVault.execute({ ownerId: OWNER, masterPassword: 'short' }));
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(world.vaults.store.size).toBe(0);
    expect(world.cipher.unlocked).toBe(false);
  });

  it('stores only KDF params + verifier (never the password) and leaves the vault unlocked', async () => {
    const world = createWorld();
    const vault = expectOk(
      await world.setupVault.execute({ ownerId: OWNER, masterPassword: MASTER_PASSWORD }),
    );

    expect(world.cipher.unlocked).toBe(true);
    expect(vault.kdfParams.iterations).toBeGreaterThanOrEqual(100_000);
    expect(JSON.stringify(vault, (_k, v: unknown) => (v instanceof Uint8Array ? [...v] : v))).not.toContain(
      MASTER_PASSWORD,
    );
    expect(utf8Decode(vault.verifier.ciphertext)).not.toContain(VAULT_VERIFIER_PLAINTEXT);
  });

  it('does not allow a second setup', async () => {
    const world = await worldWithUnlockedVault();
    const error = expectErr(
      await world.setupVault.execute({ ownerId: OWNER, masterPassword: MASTER_PASSWORD }),
    );
    expect(error.code).toBe('VAULT_ALREADY_SETUP');
  });

  it('unlocks with the right password, locally', async () => {
    const world = await worldWithUnlockedVault();
    await world.lockVault.execute();
    expect(world.cipher.unlocked).toBe(false);

    expectOk(await world.unlockVault.execute({ ownerId: OWNER, masterPassword: MASTER_PASSWORD }));
    expect(world.cipher.unlocked).toBe(true);
  });

  it('detects a wrong password via authentication failure and wipes the key again', async () => {
    const world = await worldWithUnlockedVault();
    await world.lockVault.execute();

    const error = expectErr(
      await world.unlockVault.execute({ ownerId: OWNER, masterPassword: 'definitely wrong' }),
    );
    expect(error.code).toBe('INVALID_MASTER_PASSWORD');
    expect(world.cipher.unlocked).toBe(false);
  });

  it('treats too-short input on unlock as a wrong password (no policy leak)', async () => {
    const world = await worldWithUnlockedVault();
    const error = expectErr(await world.unlockVault.execute({ ownerId: OWNER, masterPassword: 'abc' }));
    expect(error.code).toBe('INVALID_MASTER_PASSWORD');
  });

  it('cannot unlock a vault that was never set up', async () => {
    const world = createWorld();
    const error = expectErr(
      await world.unlockVault.execute({ ownerId: OWNER, masterPassword: MASTER_PASSWORD }),
    );
    expect(error.code).toBe('VAULT_NOT_SETUP');
  });
});

describe('vault notes', () => {
  it('refuses to create or list while locked', async () => {
    const world = await worldWithUnlockedVault();
    await world.lockVault.execute();

    const created = await world.createVaultNote.execute({
      ownerId: OWNER,
      title: 'secret',
      plainText: 'token',
      crdtState: crdt,
    });
    expect(expectErr(created).code).toBe('VAULT_LOCKED');
    expect(expectErr(await world.listVaultNotes.execute({ ownerId: OWNER })).code).toBe('VAULT_LOCKED');
  });

  it('stores an opaque blob: no title or text is visible in the entity', async () => {
    const world = await worldWithUnlockedVault();
    const note = expectOk(
      await world.createVaultNote.execute({
        ownerId: OWNER,
        title: 'AWS Keys',
        plainText: 'AKIA-SUPER-SECRET',
        crdtState: crdt,
      }),
    );

    expect(Object.keys(note).sort()).toEqual(
      ['createdAt', 'deletedAt', 'encryptedPayload', 'id', 'kind', 'ownerId', 'updatedAt'].sort(),
    );
    const raw = utf8Decode(note.encryptedPayload.ciphertext);
    expect(raw).not.toContain('AKIA-SUPER-SECRET');
    expect(raw).not.toContain('AWS Keys');
  });

  it('round-trips through open, including the CRDT state', async () => {
    const world = await worldWithUnlockedVault();
    const note = expectOk(
      await world.createVaultNote.execute({
        ownerId: OWNER,
        title: 'Notum',
        plainText: 'gizli içerik',
        crdtState: crdt,
      }),
    );

    const opened = expectOk(await world.openVaultNote.execute({ ownerId: OWNER, noteId: note.id }));
    expect(opened.payload.title).toBe('Notum');
    expect(opened.payload.plainText).toBe('gizli içerik');
    expect([...opened.payload.crdtState]).toEqual([9, 8, 7]);
  });

  it('re-encrypts on update and keeps the note readable', async () => {
    const world = await worldWithUnlockedVault();
    const note = expectOk(
      await world.createVaultNote.execute({ ownerId: OWNER, title: 'v1', plainText: 'a', crdtState: crdt }),
    );
    world.clock.advance(5_000);

    const updated = expectOk(
      await world.updateVaultNote.execute({
        ownerId: OWNER,
        noteId: note.id,
        title: 'v2',
        plainText: 'b',
        crdtState: crdt,
      }),
    );
    expect(updated.encryptedPayload).not.toEqual(note.encryptedPayload);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(note.updatedAt.getTime());

    const opened = expectOk(await world.openVaultNote.execute({ ownerId: OWNER, noteId: note.id }));
    expect(opened.payload.title).toBe('v2');
  });

  it('fails decryption with a foreign key instead of returning garbage', async () => {
    const world = await worldWithUnlockedVault();
    const note = expectOk(
      await world.createVaultNote.execute({ ownerId: OWNER, title: 't', plainText: 'p', crdtState: crdt }),
    );

    const stranger = new FakeVaultCipher();
    await stranger.unlock(
      expectOk(createMasterPassword('another-master-password')),
      await stranger.createKdfParams(),
    );
    const stored = world.notes.store.get(note.id);
    if (stored?.kind !== 'vault') {
      throw new Error('expected vault note');
    }
    expect(expectErr(await stranger.decrypt(stored.encryptedPayload)).code).toBe('DECRYPTION_FAILED');
  });

  it('lists decrypted summaries, searches in memory and reports undecryptable notes', async () => {
    const world = await worldWithUnlockedVault();
    const bank = expectOk(
      await world.createVaultNote.execute({ ownerId: OWNER, title: 'Banka', plainText: 'IBAN 123', crdtState: crdt }),
    );
    world.clock.advance(1_000);
    expectOk(
      await world.createVaultNote.execute({ ownerId: OWNER, title: 'Wifi', plainText: 'parola', crdtState: crdt }),
    );
    await world.createVaultNote.execute({ ownerId: OTHER_USER, title: 'foreign', plainText: '', crdtState: crdt });

    const everything = expectOk(await world.listVaultNotes.execute({ ownerId: OWNER }));
    expect(everything.items.map((i) => i.title)).toEqual(['Wifi', 'Banka']);

    const filtered = expectOk(await world.listVaultNotes.execute({ ownerId: OWNER, query: 'iban' }));
    expect(filtered.items.map((i) => i.id)).toEqual([bank.id]);

    const stored = world.notes.store.get(bank.id);
    if (stored?.kind !== 'vault') {
      throw new Error('expected vault note');
    }
    world.notes.store.set(bank.id, {
      ...stored,
      encryptedPayload: { ...stored.encryptedPayload, ciphertext: new Uint8Array(32) },
    });
    const withCorrupt = expectOk(await world.listVaultNotes.execute({ ownerId: OWNER }));
    expect(withCorrupt.undecryptable).toEqual([bank.id]);
    expect(withCorrupt.items).toHaveLength(1);
  });

  it('lets standard-note use cases reject vault notes and vice versa', async () => {
    const world = await worldWithUnlockedVault();
    const vaultNote = expectOk(
      await world.createVaultNote.execute({ ownerId: OWNER, title: 't', plainText: 'p', crdtState: crdt }),
    );
    const standard = expectOk(await world.createStandardNote.execute({ ownerId: OWNER }));

    expect(
      expectErr(await world.updateStandardNote.execute({ ownerId: OWNER, noteId: vaultNote.id, title: 'x' })).code,
    ).toBe('NOTE_KIND_MISMATCH');
    expect(
      expectErr(await world.openVaultNote.execute({ ownerId: OWNER, noteId: standard.id })).code,
    ).toBe('NOTE_KIND_MISMATCH');
  });

  it('deletes a vault note even while locked (nothing is decrypted)', async () => {
    const world = await worldWithUnlockedVault();
    const note = expectOk(
      await world.createVaultNote.execute({ ownerId: OWNER, title: 't', plainText: 'p', crdtState: crdt }),
    );
    await world.lockVault.execute();

    expectOk(await world.deleteNote.execute({ ownerId: OWNER, noteId: note.id }));
    expect(world.notes.store.get(note.id)?.deletedAt).not.toBeNull();
  });

  describe('NoteCrdtPersistenceProvider implementations', () => {
    it('StandardNoteCrdtPersistenceProvider loads and saves snapshot directly', async () => {
      const world = createWorld();
      const note = expectOk(
        await world.createStandardNote.execute({ ownerId: OWNER, title: 'Standart Not' }),
      );

      const provider = new StandardNoteCrdtPersistenceProvider(world.notes, world.clock);

      // Save a new snapshot
      const snapshot = new Uint8Array([10, 20, 30]);
      const saveRes = await provider.saveSnapshot({
        ownerId: OWNER,
        noteId: note.id,
        snapshot,
        plainText: 'Güncel metin',
        title: 'Güncel Başlık',
      });
      expectOk(saveRes);

      // Verify loaded initial state
      const loadRes = expectOk(await provider.loadInitialState(OWNER, note.id));
      expect(loadRes.snapshot).toEqual(snapshot);
      expect(loadRes.plainText).toBe('Güncel metin');
      expect(loadRes.title).toBe('Güncel Başlık');
    });

    it('VaultNoteCrdtPersistenceProvider rejects operations when vault is locked', async () => {
      const world = createWorld(); // Locked by default
      const provider = new VaultNoteCrdtPersistenceProvider(world.notes, world.cipher, world.clock);

      const loadErr = expectErr(await provider.loadInitialState(OWNER, 'any-id' as any));
      expect(loadErr.code).toBe('VAULT_LOCKED');

      const saveErr = expectErr(
        await provider.saveSnapshot({
          ownerId: OWNER,
          noteId: 'any-id' as any,
          snapshot: new Uint8Array([1, 2, 3]),
          plainText: 'text',
        }),
      );
      expect(saveErr.code).toBe('VAULT_LOCKED');
    });

    it('VaultNoteCrdtPersistenceProvider saves encrypted snapshot without saving plainText to disk', async () => {
      const world = await worldWithUnlockedVault();
      const vaultNote = expectOk(
        await world.createVaultNote.execute({
          ownerId: OWNER,
          title: 'Kasa Notu',
          plainText: 'Gizli Bilgi',
          crdtState: crdt,
        }),
      );

      const provider = new VaultNoteCrdtPersistenceProvider(world.notes, world.cipher, world.clock);

      // Save new encrypted snapshot
      const newSnapshot = new Uint8Array([55, 66, 77]);
      const saveRes = await provider.saveSnapshot({
        ownerId: OWNER,
        noteId: vaultNote.id,
        snapshot: newSnapshot,
        plainText: 'Gizli Parola: 1234',
        title: 'Güncel Kasa Başlığı',
      });
      expectOk(saveRes);

      // Verify that plainText is NOT stored anywhere unencrypted on the stored note object
      const stored = world.notes.store.get(vaultNote.id);
      expect(stored).toBeDefined();
      expect((stored as any).plainText).toBeUndefined();
      expect((stored as any).title).toBeUndefined();

      // Verify loadInitialState can decrypt it when unlocked
      const loadRes = expectOk(await provider.loadInitialState(OWNER, vaultNote.id));
      expect(loadRes.snapshot).toEqual(newSnapshot);
      expect(loadRes.plainText).toBe('Gizli Parola: 1234');
      expect(loadRes.title).toBe('Güncel Kasa Başlığı');
    });

    it('rejects decryption when AAD noteId does not match (payload transplantation defense)', async () => {
      const world = await worldWithUnlockedVault();
      const note1 = expectOk(
        await world.createVaultNote.execute({
          ownerId: OWNER,
          title: 'Note 1',
          plainText: 'Secret 1',
          crdtState: crdt,
        }),
      );
      const note2 = expectOk(
        await world.createVaultNote.execute({
          ownerId: OWNER,
          title: 'Note 2',
          plainText: 'Secret 2',
          crdtState: crdt,
        }),
      );

      // Transplant encrypted payload of note1 into note2
      const stored1 = world.notes.store.get(note1.id);
      const stored2 = world.notes.store.get(note2.id);
      if (!stored1 || !stored2 || stored1.kind !== 'vault' || stored2.kind !== 'vault') {
        throw new Error('expected vault notes in store');
      }
      world.notes.store.set(note2.id, {
        ...stored2,
        encryptedPayload: stored1.encryptedPayload,
      });

      const provider = new VaultNoteCrdtPersistenceProvider(world.notes, world.cipher, world.clock);
      // Loading note2 with note1's transplanted payload must fail decryption because AAD (noteId) does not match
      const err = expectErr(await provider.loadInitialState(OWNER, note2.id));
      expect(err.code).toBe('DECRYPTION_FAILED');
    });
  });
});
