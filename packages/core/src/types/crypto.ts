/**
 * Cryptographic payload structure for E2EE Vault items.
 * AES-256-GCM authenticated encryption output.
 */
export interface EncryptedPayload {
  /** Initialization vector (Base64 encoded, 12 bytes) */
  iv: string;
  /** Ciphertext including the 128-bit authentication tag (Base64 encoded) */
  ciphertext: string;
  /** Salt used for PBKDF2 key derivation (Base64 encoded, 16 bytes) */
  salt: string;
  /** Version indicator for key derivation and crypto scheme */
  version: 1;
}

export interface KeyDerivationOptions {
  iterations?: number;
  hash?: 'SHA-256' | 'SHA-512';
}

export interface CryptoWorkerMessageRequest {
  id: string;
  action: 'deriveKey' | 'encrypt' | 'decrypt' | 'verifyPassword';
  payload: any;
}

export interface CryptoWorkerMessageResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}
