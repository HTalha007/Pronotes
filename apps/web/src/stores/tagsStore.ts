import { create } from 'zustand';
import { domain } from '@pronotes/core';
import { compositionRoot, LOCAL_USER_ID } from '../composition-root';

interface TagsState {
  tags: domain.Tag[];
  selectedTagId: domain.TagId | null;
  isLoading: boolean;
  loadTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<domain.Tag | null>;
  deleteTag: (id: domain.TagId) => Promise<void>;
  setSelectedTagId: (id: domain.TagId | null) => void;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  selectedTagId: null,
  isLoading: true,

  loadTags: async () => {
    await compositionRoot.init();
    const res = await compositionRoot.listTags.execute({ ownerId: LOCAL_USER_ID });
    if (res.ok) {
      set({ tags: [...res.value], isLoading: false });
    } else {
      set({ tags: [], isLoading: false });
    }
  },

  createTag: async (name: string, color?: string) => {
    await compositionRoot.init();
    const res = await compositionRoot.createTag.execute({
      ownerId: LOCAL_USER_ID,
      name,
      color,
    });
    if (res.ok) {
      set({ tags: [...get().tags, res.value].sort((a, b) => a.name.localeCompare(b.name)) });
      return res.value;
    }
    return null;
  },

  deleteTag: async (id: domain.TagId) => {
    await compositionRoot.init();
    const res = await compositionRoot.deleteTag.execute({
      ownerId: LOCAL_USER_ID,
      tagId: id,
    });
    if (res.ok) {
      set({
        tags: get().tags.filter((t) => t.id !== id),
        selectedTagId: get().selectedTagId === id ? null : get().selectedTagId,
      });
    }
  },

  setSelectedTagId: (selectedTagId) => set({ selectedTagId }),
}));
