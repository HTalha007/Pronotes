import { create } from 'zustand';
import { domain } from '@pronotes/core';
import { compositionRoot, LOCAL_USER_ID } from '../composition-root';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';

const { parseNoteId, toCrdtState, createVaultNote } = domain;

interface NotesState {
  notes: domain.Note[];
  activeFilter: 'all' | 'vault';
  searchQuery: string;
  selectedNote: domain.Note | null;
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  createStandardNote: (
    title?: string,
    content?: string,
    tagIds?: readonly domain.TagId[],
  ) => Promise<domain.StandardNote | null>;
  createVaultNote: (title: string, content: string) => Promise<domain.VaultNote | null>;
  updateNote: (updatedNote: domain.Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveFilter: (filter: 'all' | 'vault') => void;
  setSearchQuery: (query: string) => void;
  setSelectedNote: (note: domain.Note | null) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  activeFilter: 'all',
  searchQuery: '',
  selectedNote: null,
  isLoading: true,

  loadNotes: async () => {
    await compositionRoot.init();
    const standardRes = await compositionRoot.listNotes.execute({ ownerId: LOCAL_USER_ID });
    const vaultNotes = compositionRoot.noteRepo
      ? await compositionRoot.noteRepo.findVaultByOwner(LOCAL_USER_ID)
      : [];

    const standardNotes = standardRes.ok ? standardRes.value : [];
    const allNotes: domain.Note[] = [...standardNotes, ...vaultNotes].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    set({
      notes: allNotes,
      isLoading: false,
    });
  },

  createStandardNote: async (title = '', content = '', tagIds = []) => {
    await compositionRoot.init();
    const createdRes = await compositionRoot.createStandardNote.execute({
      ownerId: LOCAL_USER_ID,
      title,
      tagIds,
    });

    if (!createdRes.ok) {
      return null;
    }

    let note = createdRes.value;

    if (content.trim().length > 0) {
      const updatedRes = await compositionRoot.updateStandardNote.execute({
        ownerId: LOCAL_USER_ID,
        noteId: note.id,
        body: {
          content: toCrdtState(new TextEncoder().encode(content)),
          plainText: content,
        },
      });
      if (updatedRes.ok) {
        note = updatedRes.value;
      }
    }

    set((state) => ({
      notes: [note, ...state.notes],
      selectedNote: note,
    }));

    return note;
  },

  createVaultNote: async (title: string, content: string) => {
    await compositionRoot.init();
    const plainJson = JSON.stringify({ title, content });
    const encryptedData = await cryptoWorkerClient.encryptVaultItem(plainJson);

    const blob: domain.EncryptedBlob = {
      version: 1,
      iv: new Uint8Array(
        atob(encryptedData.iv)
          .split('')
          .map((c) => c.charCodeAt(0)),
      ),
      ciphertext: new Uint8Array(
        atob(encryptedData.ciphertext)
          .split('')
          .map((c) => c.charCodeAt(0)),
      ),
    };

    const newVaultNote = createVaultNote({
      id: parseNoteId(crypto.randomUUID()).ok
        ? (parseNoteId(crypto.randomUUID()) as { ok: true; value: domain.NoteId }).value
        : ('vault-' + Date.now() as domain.NoteId),
      ownerId: LOCAL_USER_ID,
      encryptedPayload: blob,
      now: new Date(),
    });

    if (compositionRoot.noteRepo) {
      await compositionRoot.noteRepo.save(newVaultNote);
    }

    set((state) => ({
      notes: [newVaultNote, ...state.notes],
      selectedNote: newVaultNote,
    }));

    return newVaultNote;
  },

  updateNote: async (updatedNote: domain.Note) => {
    await compositionRoot.init();
    if (updatedNote.kind === 'standard') {
      const res = await compositionRoot.updateStandardNote.execute({
        ownerId: LOCAL_USER_ID,
        noteId: updatedNote.id,
        title: updatedNote.title,
        tagIds: updatedNote.tagIds,
        body: {
          content: updatedNote.content,
          plainText: updatedNote.plainText,
        },
      });
      if (res.ok) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === updatedNote.id ? res.value : n)),
          selectedNote: state.selectedNote?.id === updatedNote.id ? res.value : state.selectedNote,
        }));
      }
    } else {
      if (compositionRoot.noteRepo) {
        await compositionRoot.noteRepo.save(updatedNote);
      }
      set((state) => ({
        notes: state.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
        selectedNote: state.selectedNote?.id === updatedNote.id ? updatedNote : state.selectedNote,
      }));
    }
  },

  deleteNote: async (id: string) => {
    await compositionRoot.init();
    const noteIdRes = parseNoteId(id);
    if (noteIdRes.ok) {
      await compositionRoot.deleteNote.execute({
        ownerId: LOCAL_USER_ID,
        noteId: noteIdRes.value,
      });
    }

    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
    }));
  },

  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),
}));
