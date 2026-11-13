import { create } from 'zustand';
import { domain } from '@pronotes/core';
import { compositionRoot, LOCAL_USER_ID } from '../composition-root';
import { useNotesStore } from './notesStore';
import { useTagsStore } from './tagsStore';

async function migrateLocalDataToUser(userId: domain.UserId) {
  if (!compositionRoot.noteRepo || !compositionRoot.tagRepo) return;
  const localStd = await compositionRoot.noteRepo.findStandardByOwner(LOCAL_USER_ID);
  const localVlt = await compositionRoot.noteRepo.findVaultByOwner(LOCAL_USER_ID);
  const localTags = await compositionRoot.tagRepo.findByOwner(LOCAL_USER_ID);

  for (const n of [...localStd, ...localVlt]) {
    await compositionRoot.noteRepo.save({ ...n, ownerId: userId });
  }
  for (const t of localTags) {
    await compositionRoot.tagRepo.save({ ...t, ownerId: userId });
  }
}

interface AuthState {
  user: domain.User | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncReport: domain.SyncReport | null;
  error: string | null;
  initializeAuth: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isSyncing: false,
  syncReport: null,
  error: null,

  initializeAuth: async () => {
    await compositionRoot.init();
    if (compositionRoot.getCurrentUser) {
      const res = await compositionRoot.getCurrentUser.execute();
      const user = res.ok ? res.value : null;
      set({ user, isLoading: false });
      if (user) {
        get().syncNow();
      }
    } else {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    await compositionRoot.init();
    if (!compositionRoot.signUp) {
      set({ isLoading: false, error: 'Kimlik doğrulama servisi hazır değil.' });
      return false;
    }

    const res = await compositionRoot.signUp.execute({ email, password });
    if (!res.ok) {
      set({
        isLoading: false,
        error:
          res.error.code === 'VALIDATION_ERROR'
            ? 'Geçerli bir e-posta ve en az 8 karakterli şifre girin.'
            : (res.error as any).reason === 'email-taken'
            ? 'Bu e-posta adresi zaten kullanımda.'
            : 'Kayıt işlemi başarısız oldu.',
      });
      return false;
    }

    await migrateLocalDataToUser(res.value.id);
    set({ user: res.value, isLoading: false, error: null });
    await useNotesStore.getState().loadNotes();
    await useTagsStore.getState().loadTags();
    get().syncNow();
    return true;
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    await compositionRoot.init();
    if (!compositionRoot.signIn) {
      set({ isLoading: false, error: 'Kimlik doğrulama servisi hazır değil.' });
      return false;
    }

    const res = await compositionRoot.signIn.execute({ email, password });
    if (!res.ok) {
      set({
        isLoading: false,
        error:
          res.error.code === 'VALIDATION_ERROR'
            ? 'Geçerli bir e-posta ve en az 8 karakterli şifre girin.'
            : (res.error as any).reason === 'invalid-credentials'
            ? 'E-posta veya şifre hatalı.'
            : 'Giriş yapılamadı.',
      });
      return false;
    }

    await migrateLocalDataToUser(res.value.id);
    set({ user: res.value, isLoading: false, error: null });
    await useNotesStore.getState().loadNotes();
    await useTagsStore.getState().loadTags();
    get().syncNow();
    return true;
  },

  signOut: async () => {
    await compositionRoot.init();
    if (compositionRoot.signOut) {
      await compositionRoot.signOut.execute();
    }
    set({ user: null, syncReport: null });
    await useNotesStore.getState().loadNotes();
    await useTagsStore.getState().loadTags();
  },

  syncNow: async () => {
    const user = get().user;
    if (!user || !compositionRoot.synchronizeNotes) return;

    set({ isSyncing: true });
    try {
      const res = await compositionRoot.synchronizeNotes.execute({ ownerId: user.id });
      if (res.ok && res.value.status === 'synced') {
        set({ syncReport: res.value.report, isSyncing: false });
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
