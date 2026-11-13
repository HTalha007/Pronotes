import { create } from 'zustand';
import * as Y from 'yjs';
import { domain, YjsDocumentManager } from '@pronotes/core';
import { compositionRoot, LOCAL_USER_ID } from '../composition-root';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';
import { useAuthStore } from './authStore';

const getEffectiveOwnerId = (): domain.UserId => {
  return useAuthStore.getState().user?.id || LOCAL_USER_ID;
};

const { parseNoteId, toCrdtState, createVaultNote } = domain;

interface NotesState {
  notes: domain.Note[];
  activeFilter: 'all' | 'vault';
  searchQuery: string;
  selectedNote: domain.Note | null;
  isLoading: boolean;
  decryptedVaultCache: Record<string, { title: string; plainText: string }>;
  loadNotes: () => Promise<void>;
  createStandardNote: (
    title?: string,
    content?: string,
    tagIds?: readonly domain.TagId[],
    crdtSnapshot?: Uint8Array,
    color?: string,
  ) => Promise<domain.StandardNote | null>;
  createVaultNote: (
    title: string,
    content: string,
    crdtSnapshot?: Uint8Array,
  ) => Promise<domain.VaultNote | null>;
  updateNote: (updatedNote: domain.Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveFilter: (filter: 'all' | 'vault') => void;
  setSearchQuery: (query: string) => void;
  setSelectedNote: (note: domain.Note | null) => void;
  setDecryptedVaultItem: (noteId: string, item: { title: string; plainText: string }) => void;
  clearVaultCache: () => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  activeFilter: 'all',
  searchQuery: '',
  selectedNote: null,
  isLoading: true,
  decryptedVaultCache: {},

  loadNotes: async () => {
    await compositionRoot.init();
    const ownerId = getEffectiveOwnerId();
    const standardRes = await compositionRoot.listNotes.execute({ ownerId });
    const vaultNotes = compositionRoot.noteRepo
      ? await compositionRoot.noteRepo.findVaultByOwner(ownerId)
      : [];

    let unmigratedStd: domain.StandardNote[] = [];
    let unmigratedVlt: domain.VaultNote[] = [];
    if (ownerId !== LOCAL_USER_ID && compositionRoot.noteRepo) {
      unmigratedStd = [...(await compositionRoot.noteRepo.findStandardByOwner(LOCAL_USER_ID))];
      unmigratedVlt = [...(await compositionRoot.noteRepo.findVaultByOwner(LOCAL_USER_ID))];
    }

    const standardNotes = standardRes.ok ? standardRes.value : [];
    const allNotes: domain.Note[] = [
      ...standardNotes,
      ...vaultNotes,
      ...unmigratedStd,
      ...unmigratedVlt,
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    set({
      notes: allNotes,
      isLoading: false,
    });
  },

  createStandardNote: async (
    title = '',
    content = '',
    tagIds = [],
    crdtSnapshot?: Uint8Array,
    color?: string,
  ) => {
    await compositionRoot.init();

    let initialBody: { content: domain.CrdtState; plainText: string } | undefined = undefined;
    if (crdtSnapshot && crdtSnapshot.length > 0) {
      initialBody = {
        content: toCrdtState(crdtSnapshot),
        plainText: content,
      };
    } else if (content.trim().length > 0) {
      const { doc } = YjsDocumentManager.createNoteDoc('init' as any);
      const p = new Y.XmlElement('paragraph');
      p.insert(0, [new Y.XmlText(content)]);
      doc.getXmlFragment('content').insert(0, [p]);
      initialBody = {
        content: toCrdtState(YjsDocumentManager.createSnapshot(doc)),
        plainText: content,
      };
      doc.destroy();
    }

    const createdRes = await compositionRoot.createStandardNote.execute({
      ownerId: getEffectiveOwnerId(),
      title,
      tagIds,
      body: initialBody,
      color,
    });

    if (!createdRes.ok) {
      return null;
    }

    const note = createdRes.value;

    set((state) => ({
      notes: [note, ...state.notes],
      selectedNote: note,
    }));

    return note;
  },

  createVaultNote: async (title: string, content: string, crdtSnapshot?: Uint8Array) => {
    await compositionRoot.init();
    const newNoteId = parseNoteId(crypto.randomUUID()).ok
      ? (parseNoteId(crypto.randomUUID()) as { ok: true; value: domain.NoteId }).value
      : ('vault-' + Date.now() as domain.NoteId);

    const plainJson = JSON.stringify({
      title,
      content,
      crdtState: crdtSnapshot ? Array.from(crdtSnapshot) : [],
    });
    const encryptedData = await cryptoWorkerClient.encryptVaultItem(plainJson, newNoteId);

    const blob: domain.EncryptedBlob = {
      version: 1,
      alg: 'AES-GCM',
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
      id: newNoteId,
      ownerId: getEffectiveOwnerId(),
      encryptedPayload: blob,
      now: new Date(),
    });

    if (compositionRoot.noteRepo) {
      await compositionRoot.noteRepo.save(newVaultNote);
    }

    set((state) => ({
      notes: [newVaultNote, ...state.notes],
      selectedNote: newVaultNote,
      decryptedVaultCache: {
        ...state.decryptedVaultCache,
        [newNoteId]: { title, plainText: content },
      },
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
        color: updatedNote.color,
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

    set((state) => {
      const { [id]: _, ...restCache } = state.decryptedVaultCache;
      return {
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        decryptedVaultCache: restCache,
      };
    });
  },

  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),

  setDecryptedVaultItem: (noteId: string, item: { title: string; plainText: string }) =>
    set((state) => ({
      decryptedVaultCache: {
        ...state.decryptedVaultCache,
        [noteId]: item,
      },
    })),

  clearVaultCache: () => set({ decryptedVaultCache: {} }),
}));
