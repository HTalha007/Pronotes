import { create } from 'zustand';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';

interface VaultState {
  isUnlocked: boolean;
  vaultSalt: string | null;
  error: string | null;
  isVerifying: boolean;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => Promise<void>;
  clearError: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  vaultSalt: localStorage.getItem('pronotes_vault_salt'),
  error: null,
  isVerifying: false,

  unlockVault: async (password: string) => {
    set({ isVerifying: true, error: null });
    try {
      const existingSalt = get().vaultSalt || undefined;
      const res = await cryptoWorkerClient.unlockVault(password, existingSalt);

      if (!existingSalt && res.saltBase64) {
        localStorage.setItem('pronotes_vault_salt', res.saltBase64);
        set({ vaultSalt: res.saltBase64 });
      }

      set({ isUnlocked: true, isVerifying: false, error: null });
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
