import { EncryptedPayload } from '../types/crypto';

const PBKDF2_ITERATIONS = 100_000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits

// Base64 helper functions
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-256-GCM CryptoKey from a Master Password and Salt using PBKDF2.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-256-GCM',
      length: AES_KEY_LENGTH,
    },
    false, // Do not allow key export for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary text or data using AES-256-GCM.
 */
export async function encryptData(
  plainText: string,
  key: CryptoKey,
  salt: Uint8Array
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-256-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encoder.encode(plainText)
  );

  return {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    salt: arrayBufferToBase64(salt),
    version: 1,
  };
}

/**
 * Decrypts an AES-256-GCM payload.
 * Throws an Error if password/key is incorrect (MAC authentication failure).
 */
export async function decryptData(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-256-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    // If decryption fails, GCM throws an OperationError due to tag mismatch
    throw new Error('Şifre Yanlış veya veri bozulmuş.');
  }
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}
