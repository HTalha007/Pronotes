import { describe, expect, it } from 'vitest';
import {
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  generateSalt,
} from '../../src/crypto/crypto-engine';

describe('CryptoEngine (WebCrypto AES-256-GCM & PBKDF2)', () => {
  const password = 'TestMasterPassword123!';

  it('generates a 16-byte cryptographically random salt', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    expect(salt1).toBeInstanceOf(Uint8Array);
    expect(salt1.length).toBe(16);
    expect(salt2.length).toBe(16);
    // Two salts must be distinct
    expect(salt1).not.toEqual(salt2);
  });

  it('derives a valid AES-256-GCM CryptoKey using PBKDF2', async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt, 10_000); // 10k iterations for fast unit test

    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.type).toBe('secret');
    expect(key.extractable).toBe(false); // Non-exportable for security
  });

  it('guarantees IV uniqueness on repeated encryption of identical plaintext', async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt, 10_000);
    const plainText = 'Gizli Kasa Notu İçeriği';

    const payload1 = await encryptData(plainText, key, salt);
    const payload2 = await encryptData(plainText, key, salt);

    // IV must NEVER repeat
    expect(payload1.iv).not.toBe(payload2.iv);
    // Consequently, ciphertext must also differ even for identical plaintext
    expect(payload1.ciphertext).not.toBe(payload2.ciphertext);
  });

  it('successfully encrypts and decrypts text roundtrip', async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt, 10_000);
    const plainText = 'Bu çok gizli bir test notudur: 12345! @#₺%^&*()';

    const payload = await encryptData(plainText, key, salt);
    const decrypted = await decryptData(payload, key);

    expect(decrypted).toBe(plainText);
  });

  it('rejects decryption when wrong key is provided (MAC tag mismatch)', async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt, 10_000);
    const wrongKey = await deriveKeyFromPassword('TamamenFarkliSifre999!', salt, 10_000);

    const payload = await encryptData('Hassas Veri', key, salt);

    await expect(decryptData(payload, wrongKey)).rejects.toThrow('Şifre Yanlış veya veri bozulmuş.');
  });

  it('rejects decryption if ciphertext has been tampered with', async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt, 10_000);

    const payload = await encryptData('Bozulacak Veri', key, salt);
    // Tamper with the base64 ciphertext
    const tamperedPayload = {
      ...payload,
      ciphertext: payload.ciphertext.slice(0, -4) + 'AAAA',
    };

    await expect(decryptData(tamperedPayload, key)).rejects.toThrow();
  });

  it('authenticates Additional Authenticated Data (AAD, noteId) cryptographically', async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt, 10_000);
    const noteId = 'vault-note-xyz-123';
    const plainText = 'AAD ile korunan kasa verisi';

    // 1. Encrypt with noteId as AAD
    const payload = await encryptData(plainText, key, salt, noteId);

    // 2. Decrypt with matching noteId succeeds
    const decrypted = await decryptData(payload, key, noteId);
    expect(decrypted).toBe(plainText);

    // 3. Decrypt with mismatched noteId (attacker copying payload to another note) fails
    await expect(decryptData(payload, key, 'different-note-id')).rejects.toThrow(
      'Şifre Yanlış veya veri bozulmuş.',
    );

    // 4. Decrypt with omitted AAD also fails
    await expect(decryptData(payload, key)).rejects.toThrow('Şifre Yanlış veya veri bozulmuş.');
  });
});
