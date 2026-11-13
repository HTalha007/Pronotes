import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  createEmail,
  createEncryptedBlob,
  createKdfParams,
  createMasterPassword,
  decodeVaultNotePayload,
  encodeVaultNotePayload,
  GetCurrentUser,
  parseUserId,
  SignIn,
  SignOut,
  SignUp,
  SynchronizeNotes,
  SyncFailedError,
  toCrdtState,
  utf8Encode,
  createNoteTitle,
  err,
  type User,
} from '../../src/domain';
import {
  expectErr,
  expectOk,
  FakeAuthGateway,
  FakeConnectivity,
  FakeSyncGateway,
  FakeVaultCipher,
} from '../support/fakes';
import { OWNER } from '../support/world';

describe('synchronize notes', () => {
  it('skips silently when offline (not an error, gateway untouched)', async () => {
    const gateway = new FakeSyncGateway();
    const useCase = new SynchronizeNotes(gateway, new FakeConnectivity(false));

    expect(expectOk(await useCase.execute({ ownerId: OWNER }))).toEqual({ status: 'skipped-offline' });
    expect(gateway.calls).toBe(0);
  });

  it('synchronizes when online', async () => {
    const gateway = new FakeSyncGateway();
    const useCase = new SynchronizeNotes(gateway, new FakeConnectivity(true));

    expect(expectOk(await useCase.execute({ ownerId: OWNER }))).toEqual({
      status: 'synced',
      report: { pushed: 2, pulled: 1 },
    });
  });

  it('surfaces gateway failures as SYNC_FAILED', async () => {
    const gateway = new FakeSyncGateway();
    gateway.result = err(new SyncFailedError());
    const useCase = new SynchronizeNotes(gateway, new FakeConnectivity(true));

    expect(expectErr(await useCase.execute({ ownerId: OWNER })).code).toBe('SYNC_FAILED');
  });
});

describe('authentication', () => {
  const user: User = { id: OWNER, email: expectOk(createEmail('ada@example.com')) };

  it('validates credentials before calling the gateway', async () => {
    const auth = new FakeAuthGateway(user);
    expect(expectErr(await new SignUp(auth).execute({ email: 'not-an-email', password: 'long-enough-pw' })).code).toBe(
      'VALIDATION_ERROR',
    );
    expect(expectErr(await new SignIn(auth).execute({ email: 'ada@example.com', password: 'short' })).code).toBe(
      'VALIDATION_ERROR',
    );
    expect(auth.calls).toEqual([]);
  });

  it('signs in, maps gateway errors and restores the session', async () => {
    const auth = new FakeAuthGateway(user);
    expect(
      expectErr(await new SignIn(auth).execute({ email: 'ada@example.com', password: 'wrong-password' })).code,
    ).toBe('AUTHENTICATION_FAILED');

    expect(expectOk(await new SignIn(auth).execute({ email: ' ADA@Example.com ', password: 'correct-password' }))).toEqual(
      user,
    );
    expect(expectOk(await new GetCurrentUser(auth).execute())).toEqual(user);
  });

  it('locks the vault BEFORE signing out so no key outlives the session', async () => {
    const auth = new FakeAuthGateway(user);
    const cipher = new FakeVaultCipher();
    await cipher.unlock(expectOk(createMasterPassword('long-enough-master')), await cipher.createKdfParams());
    auth.calls.length = 0;
    cipher.calls.length = 0;

    expectOk(await new SignOut(auth, cipher).execute());

    expect(cipher.unlocked).toBe(false);
    expect(cipher.calls).toEqual(['lock']);
    expect(auth.calls).toEqual(['signOut']);
    expect(expectOk(await new GetCurrentUser(auth).execute())).toBeNull();
  });
});

describe('value objects & helpers', () => {
  it('round-trips base64 for every remainder length', () => {
    for (let length = 0; length < 20; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + 11) % 256);
      expect([...base64ToBytes(bytesToBase64(bytes))]).toEqual([...bytes]);
    }
    expect(bytesToBase64(utf8Encode('Man'))).toBe('TWFu');
    expect(bytesToBase64(utf8Encode('Ma'))).toBe('TWE=');
    expect(() => base64ToBytes('@@@')).toThrow();
  });

  it('round-trips a vault payload and flags corrupted payloads', () => {
    const title = expectOk(createNoteTitle('Başlık'));
    const bytes = encodeVaultNotePayload({
      title,
      plainText: 'içerik ✓',
      crdtState: toCrdtState(Uint8Array.from([0, 255, 128])),
    });
    const decoded = expectOk(decodeVaultNotePayload(bytes));
    expect(decoded.title).toBe('Başlık');
    expect(decoded.plainText).toBe('içerik ✓');
    expect([...decoded.crdtState]).toEqual([0, 255, 128]);

    expect(expectErr(decodeVaultNotePayload(utf8Encode('not json'))).code).toBe('DECRYPTION_FAILED');
    expect(expectErr(decodeVaultNotePayload(utf8Encode('{"v":2}'))).code).toBe('DECRYPTION_FAILED');
  });

  it('enforces crypto parameter invariants', () => {
    expect(expectErr(createKdfParams(1_000, new Uint8Array(16))).code).toBe('VALIDATION_ERROR');
    expect(expectErr(createKdfParams(100_000, new Uint8Array(4))).code).toBe('VALIDATION_ERROR');
    expect(createKdfParams(600_000, new Uint8Array(16)).ok).toBe(true);
    expect(expectErr(createEncryptedBlob(new Uint8Array(8), new Uint8Array(32))).code).toBe('VALIDATION_ERROR');
    expect(expectErr(createEncryptedBlob(new Uint8Array(12), new Uint8Array(4))).code).toBe('VALIDATION_ERROR');
    expect(expectOk(createMasterPassword('  8 chars ')).length).toBe(10);
    expect(expectErr(parseUserId('   ')).code).toBe('VALIDATION_ERROR');
  });
});
