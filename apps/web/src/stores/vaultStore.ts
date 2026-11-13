import { create } from 'zustand';
import type { EncryptedPayload } from '@pronotes/core';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';

interface VaultState {
  isUnlocked: boolean;
  isInitialized: boolean;
  vaultSalt: string | null;
  vaultVerifier: EncryptedPayload | null;
  error: string | null;
  isVerifying: boolean;
  setupVault: (password: string) => Promise<boolean>;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => Promise<void>;
  clearError: () => void;
}

const getStoredVerifier = (): EncryptedPayload | null => {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem('pronotes_vault_verifier');
  if (!item) return null;
  try {
    return JSON.parse(item) as EncryptedPayload;
  } catch {
    return null;
  }
};

const getStoredSalt = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pronotes_vault_salt');
};

const initialSalt = getStoredSalt();
const initialVerifier = getStoredVerifier();

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  isInitialized: Boolean(initialSalt || initialVerifier),
  vaultSalt: initialSalt,
  vaultVerifier: initialVerifier,
  error: null,
  isVerifying: false,

  setupVault: async (password: string) => {
    set({ isVerifying: true, error: null });
    try {
      const res = await cryptoWorkerClient.setupVault(password);
      localStorage.setItem('pronotes_vault_salt', res.saltBase64);
      localStorage.setItem('pronotes_vault_verifier', JSON.stringify(res.verifierPayload));

      set({
        isUnlocked: true,
        isInitialized: true,
        vaultSalt: res.saltBase64,
        vaultVerifier: res.verifierPayload,
        isVerifying: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isUnlocked: false,
        isVerifying: false,
        error: err.message || 'Kasa oluşturulamadı.',
      });
      return false;
    }
  },

  unlockVault: async (password: string) => {
    set({ isVerifying: true, error: null });
    try {
      const existingSalt = get().vaultSalt || undefined;
      const existingVerifier = get().vaultVerifier || undefined;
      const res = await cryptoWorkerClient.unlockVault(password, existingSalt, existingVerifier);

      if (res.saltBase64 && !existingSalt) {
        localStorage.setItem('pronotes_vault_salt', res.saltBase64);
        set({ vaultSalt: res.saltBase64 });
      }
      if (res.verifierPayload && !existingVerifier) {
        localStorage.setItem('pronotes_vault_verifier', JSON.stringify(res.verifierPayload));
        set({ vaultVerifier: res.verifierPayload });
      }

      set({ isUnlocked: true, isInitialized: true, isVerifying: false, error: null });
      return true;
    } catch (err: any) {
      set({
        isUnlocked: false,
        isVerifying: false,
        error: err.message || 'Şifre Yanlış.',
      });
      return false;
    }
  },

  lockVault: async () => {
    await cryptoWorkerClient.lockVault();
    set({ isUnlocked: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
