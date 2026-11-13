import {
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  generateSalt,
  base64ToArrayBuffer,
  arrayBufferToBase64,
} from '@pronotes/core';
import type { EncryptedPayload } from '@pronotes/core';

let activeVaultKey: CryptoKey | null = null;
let activeSalt: Uint8Array | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { id, action, payload } = e.data;

  try {
    switch (action) {
      case 'unlockVault': {
        const { password, saltBase64 } = payload;
        const salt = saltBase64
          ? new Uint8Array(base64ToArrayBuffer(saltBase64))
          : generateSalt();

        const key = await deriveKeyFromPassword(password, salt);
        activeVaultKey = key;
        activeSalt = salt;

        self.postMessage({
          id,
          success: true,
          result: { saltBase64: arrayBufferToBase64(salt) },
        });
        break;
      }

      case 'lockVault': {
        activeVaultKey = null;
        activeSalt = null;
        self.postMessage({ id, success: true });
        break;
      }

      case 'isUnlocked': {
        self.postMessage({
          id,
          success: true,
          result: { unlocked: activeVaultKey !== null },
        });
        break;
      }

      case 'encryptVaultItem': {
        if (!activeVaultKey || !activeSalt) {
          throw new Error('Kasa kilitli. Lütfen önce ana şifrenizi girin.');
        }
        const { plainText } = payload;
        const encrypted = await encryptData(plainText, activeVaultKey, activeSalt);
        self.postMessage({ id, success: true, result: encrypted });
        break;
      }

      case 'decryptVaultItem': {
        if (!activeVaultKey) {
          throw new Error('Kasa kilitli. Lütfen önce ana şifrenizi girin.');
        }
        const { encryptedPayload } = payload as { encryptedPayload: EncryptedPayload };
        const decrypted = await decryptData(encryptedPayload, activeVaultKey);
        self.postMessage({ id, success: true, result: decrypted });
        break;
      }

      default:
        throw new Error(`Bilinmeyen eylem: ${action}`);
    }
  } catch (error: any) {
    self.postMessage({
      id,
      success: false,
      error: error.message || 'Bilinmeyen bir hata oluştu.',
    });
  }
};
