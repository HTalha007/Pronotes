import React, { useState, useEffect } from 'react';
import { FileText, Shield, Lock, Unlock, Wifi, WifiOff, Tag as TagIcon, Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@pronotes/ui';
import { useNotesStore } from '../stores/notesStore';
import { useVaultStore } from '../stores/vaultStore';
import { useTagsStore } from '../stores/tagsStore';
import { useNavigationStore } from '../stores/navigationStore';
import type { domain } from '@pronotes/core';

interface SidebarProps {
  onOpenVaultModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenVaultModal }) => {
  const { notes, activeFilter } = useNotesStore();
  const { isUnlocked, lockVault } = useVaultStore();
  const { tags, selectedTagId, loadTags, createTag, deleteTag } = useTagsStore();
  const { navigateTo } = useNavigationStore();

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const standardCount = notes.filter((n) => n.kind === 'standard').length;
  const vaultCount = notes.filter((n) => n.kind === 'vault').length;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const handleVaultClick = () => {
    if (!isUnlocked) {
      onOpenVaultModal();
    } else {
      navigateTo({ kind: 'vault' });
    }
  };

  const handleAllNotesClick = () => {
    navigateTo({ kind: 'all-notes' });
  };

  const handleAddTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    await createTag(newTagName.trim());
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = async (e: React.MouseEvent, id: domain.TagId) => {
    e.stopPropagation();
    await deleteTag(id);
  };

  return (
    <aside className="w-[232px] border-r border-[#E8E4DE] dark:border-[#32323D] bg-[#FAF8F5] dark:bg-[#1E1E24] flex flex-col justify-between p-4 flex-shrink-0 select-none overflow-y-auto transition-colors">
      <div className="space-y-6">
        {/* App Logo / Brand */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-card bg-[#2E2E38] dark:bg-[#EDEDF0] text-white dark:text-[#18181B] flex items-center justify-center font-bold text-sm">
            Pn
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-[#2E2E38] dark:text-[#EDEDF0]">Pronotes</h1>
            <p className="text-[11px] text-[#6B6B76] dark:text-[#A1A1AA]">E2EE & Offline-First</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          <button
            onClick={handleAllNotesClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-btn text-sm font-medium transition-colors ${
              activeFilter === 'all' && selectedTagId === null
                ? 'bg-[#E8ECFB] dark:bg-[#1E294A] text-[#2F3A6B] dark:text-[#93A5F8]'
                : 'text-[#6B6B76] dark:text-[#A1A1AA] hover:bg-[#F0EDE8] dark:hover:bg-[#282833] hover:text-[#2E2E38] dark:hover:text-[#EDEDF0]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>Tüm Notlar</span>
            </div>
            <span className="text-xs text-[#9A9AA2] dark:text-[#71717A] font-mono">{standardCount}</span>
          </button>

          <button
            onClick={handleVaultClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-btn text-sm font-medium transition-colors ${
              activeFilter === 'vault'
                ? 'bg-[#E8ECFB] dark:bg-[#1E294A] text-[#2F3A6B] dark:text-[#93A5F8]'
                : 'text-[#6B6B76] dark:text-[#A1A1AA] hover:bg-[#F0EDE8] dark:hover:bg-[#282833] hover:text-[#2E2E38] dark:hover:text-[#EDEDF0]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4" />
              <span>Gizli Kasa</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#9A9AA2] dark:text-[#71717A]" />
              )}
              <span className="text-xs text-[#9A9AA2] dark:text-[#71717A] font-mono">{vaultCount}</span>
            </div>
          </button>
        </nav>

        {/* Tags Section */}
        <div className="space-y-2 pt-2 border-t border-[#E8E4DE] dark:border-[#32323D]">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-[#6B6B76] dark:text-[#A1A1AA]">
            <div className="flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5" />
              <span>Etiketler</span>
            </div>
            <button
              onClick={() => setIsAddingTag(!isAddingTag)}
              className="p-1 hover:bg-[#F0EDE8] dark:hover:bg-[#282833] rounded text-[#2E2E38] dark:text-[#EDEDF0] transition-colors"
              title="Yeni Etiket Ekle"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingTag && (
            <form onSubmit={handleAddTagSubmit} className="flex items-center gap-1 px-1">
              <input
                type="text"
                placeholder="Etiket adı..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                autoFocus
                className="w-full text-xs px-2 py-1 bg-white dark:bg-[#282833] border border-[#E8E4DE] dark:border-[#3F3F4E] text-[#2E2E38] dark:text-[#EDEDF0] rounded focus:outline-none focus:ring-1 focus:ring-[#2E2E38] dark:focus:ring-[#EDEDF0]"
              />
              <button
                type="submit"
                className="p-1 bg-[#2E2E38] dark:bg-[#EDEDF0] text-white dark:text-[#18181B] rounded hover:bg-[#3D3D4A]"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTag(false);
                  setNewTagName('');
                }}
                className="p-1 hover:bg-[#F0EDE8] dark:hover:bg-[#282833] rounded text-[#6B6B76] dark:text-[#A1A1AA]"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          )}

          <div className="space-y-0.5">
            {tags.length === 0 ? (
              <p className="text-[11px] text-[#9A9AA2] dark:text-[#71717A] px-2 py-1">Henüz etiket yok</p>
            ) : (
              tags.map((tag) => {
                const isSelected = selectedTagId === tag.id;
                return (
                  <div
                    key={tag.id}
                    className={`w-full group flex items-center justify-between px-2.5 py-1 rounded-btn text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#E8ECFB] dark:bg-[#1E294A] text-[#2F3A6B] dark:text-[#93A5F8]'
                        : 'text-[#6B6B76] dark:text-[#A1A1AA] hover:bg-[#F0EDE8] dark:hover:bg-[#282833] hover:text-[#2E2E38] dark:hover:text-[#EDEDF0]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo(isSelected ? { kind: 'all-notes' } : { kind: 'tag', tagId: tag.id });
                      }}
                      className="flex items-center gap-2 truncate flex-1 text-left py-0.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTag(e, tag.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9A9AA2] hover:text-red-600 rounded transition-opacity ml-1"
                      title="Etiketi Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Status and Quick Actions */}
      <div className="space-y-3 pt-4 border-t border-[#E8E4DE] dark:border-[#32323D]">
        <div className="flex items-center justify-between px-2 text-xs text-[#6B6B76] dark:text-[#A1A1AA]">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Çevrimiçi</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Çevrimdışı</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-[#9A9AA2] dark:text-[#71717A] uppercase">v1.1 MVP</span>
        </div>

        {isUnlocked && (
          <Button
            variant="outline"
            size="sm"
            onClick={lockVault}
            className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
          >
            <Lock className="w-3.5 h-3.5" />
            Kasayı Kilitle
          </Button>
        )}
      </div>
    </aside>
  );
};
