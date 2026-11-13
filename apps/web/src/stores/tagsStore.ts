import { create } from 'zustand';
import { domain } from '@pronotes/core';
import { compositionRoot, LOCAL_USER_ID } from '../composition-root';
import { useAuthStore } from './authStore';

const getEffectiveOwnerId = (): domain.UserId => {
  return useAuthStore.getState().user?.id || LOCAL_USER_ID;
};

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
    const ownerId = getEffectiveOwnerId();
    const res = await compositionRoot.listTags.execute({ ownerId });
    let unmigratedTags: domain.Tag[] = [];
    if (ownerId !== LOCAL_USER_ID && compositionRoot.tagRepo) {
      unmigratedTags = [...(await compositionRoot.tagRepo.findByOwner(LOCAL_USER_ID))];
    }

    const currentTags = res.ok ? [...res.value] : [];
    const all = [...currentTags, ...unmigratedTags].sort((a, b) => a.name.localeCompare(b.name));
    set({ tags: all, isLoading: false });
  },

  createTag: async (name: string, color?: string) => {
    await compositionRoot.init();
    const ownerId = getEffectiveOwnerId();
    const res = await compositionRoot.createTag.execute({
      ownerId,
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
    const ownerId = getEffectiveOwnerId();
    const res = await compositionRoot.deleteTag.execute({
      ownerId,
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
