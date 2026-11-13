import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, Palette } from 'lucide-react';
import { Card, Badge } from '@pronotes/ui';
import { domain } from '@pronotes/core';
import { useVaultStore } from '../stores/vaultStore';
import { useNotesStore } from '../stores/notesStore';
import { useTagsStore } from '../stores/tagsStore';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';
import { NOTE_COLORS, getNoteColor } from '../lib/note-colors';
import { useThemeStore } from '../stores/themeStore';

interface NoteCardProps {
  note: domain.Note;
  onClick: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const { isUnlocked } = useVaultStore();
  const { deleteNote, updateNote, decryptedVaultCache, setDecryptedVaultItem } = useNotesStore();
  const { tags } = useTagsStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [showColorPicker, setShowColorPicker] = useState(false);

  const isVault = note.kind === 'vault';
  const cachedVault = isVault ? decryptedVaultCache[note.id] : undefined;

  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(cachedVault?.title || null);
  const [decryptedSnippet, setDecryptedSnippet] = useState<string | null>(cachedVault?.plainText || null);

  useEffect(() => {
    if (isVault && isUnlocked) {
      if (cachedVault) {
        setDecryptedTitle(cachedVault.title);
        setDecryptedSnippet(cachedVault.plainText);
        return;
      }

      const vaultNote = note as domain.VaultNote;
      const ivBase64 = btoa(String.fromCharCode(...vaultNote.encryptedPayload.iv));
      const cipherBase64 = btoa(String.fromCharCode(...vaultNote.encryptedPayload.ciphertext));

      cryptoWorkerClient
        .decryptVaultItem(
          {
            iv: ivBase64,
            ciphertext: cipherBase64,
            salt: '',
            version: 1,
          },
          note.id,
        )
        .then((plain) => {
          let title = 'Başlıksız Kasa Notu';
          let snippet = '';
          try {
            const parsed = JSON.parse(plain);
            title = parsed.title || 'Başlıksız Kasa Notu';
            snippet = parsed.content ? parsed.content.replace(/<[^>]*>?/gm, '') : '';
          } catch {
            title = 'Kasa Notu';
            snippet = plain.slice(0, 100);
          }
          setDecryptedTitle(title);
          setDecryptedSnippet(snippet);
          setDecryptedVaultItem(note.id, { title, plainText: snippet });
        })
        .catch(() => {
          setDecryptedTitle('Şifreli Kasa Notu');
          setDecryptedSnippet('Deşifre edilemedi.');
        });
    } else {
      setDecryptedTitle(null);
      setDecryptedSnippet(null);
    }
  }, [note, isVault, isUnlocked, cachedVault, setDecryptedVaultItem]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNote(note.id);
  };

  if (isVault) {
    return (
      <Card
        onClick={onClick}
        className="bg-[#FAFBFD] dark:bg-[#1E202C] border-[#DCE4F9] dark:border-[#2D3354] hover:border-[#2F3A6B] dark:hover:border-[#4B5EAA] relative group transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <Badge variant="vault" className="gap-1 text-[11px]">
            <Shield className="w-3 h-3" />
            <span>Kasa</span>
          </Badge>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-1 text-[#9A9AA2] hover:text-red-600 rounded transition-opacity"
              title="Notu Sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <Lock className="w-3.5 h-3.5 text-[#2F3A6B]/70 dark:text-[#93A5F8]" />
          </div>
        </div>

        {isUnlocked ? (
          <div>
            <h3 className="font-medium text-sm text-[#2E2E38] dark:text-[#EDEDF0] line-clamp-1 mb-1">
              {decryptedTitle || 'Başlıksız Kasa Notu'}
            </h3>
            <p className="text-xs text-[#6B6B76] dark:text-[#A1A1AA] line-clamp-3">
              {decryptedSnippet || 'İçerik yok.'}
            </p>
          </div>
        ) : (
          <div className="py-3 text-center">
            <p className="text-xs font-medium text-[#2F3A6B] dark:text-[#93A5F8]">Şifreli İçerik</p>
            <p className="text-[11px] text-[#9A9AA2] dark:text-[#71717A] mt-0.5">Görmek için ana şifrenizi girin</p>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-[#E8ECFB] dark:border-[#2D3354] flex items-center justify-between text-[10px] text-[#9A9AA2] dark:text-[#71717A]">
          <span>AES-256-GCM</span>
          <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
        </div>
      </Card>
    );
  }

  const standardNote = note as domain.StandardNote;
  const noteColor = getNoteColor(standardNote.color, isDark);
  const snippet = standardNote.plainText
    ? standardNote.plainText.replace(/<[^>]*>?/gm, '').trim()
    : 'İçerik yok.';

  const attachedTags = tags.filter((t) => standardNote.tagIds.includes(t.id));

  const handleColorChange = async (e: React.MouseEvent, colorBg: string) => {
    e.stopPropagation();
    setShowColorPicker(false);
    await updateNote({
      ...standardNote,
      color: colorBg,
    });
  };

  return (
    <Card
      onClick={onClick}
      className="relative group transition-all duration-200"
      style={{
        backgroundColor: noteColor.bg,
        borderColor: noteColor.border,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-sm text-[#2E2E38] dark:text-[#EDEDF0] line-clamp-1">
          {standardNote.title || 'Başlıksız Not'}
        </h3>
        <div className="flex items-center gap-0.5">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-[#9A9AA2] hover:text-[#2E2E38] dark:hover:text-[#EDEDF0] rounded transition-opacity"
              title="Not Rengi"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-30 bg-white dark:bg-[#282833] border border-[#E8E4DE] dark:border-[#3F3F4E] rounded-card p-1.5 shadow-md flex items-center gap-1.5"
              >
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => handleColorChange(e, c.bg)}
                    className={`w-4 h-4 rounded-full border transition-transform ${
                      noteColor.bg.toLowerCase() === (isDark ? c.darkBg.toLowerCase() : c.bg.toLowerCase())
                        ? 'ring-1 ring-[#2E2E38] dark:ring-[#EDEDF0] scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: isDark ? c.darkBg : c.bg,
                      borderColor: isDark ? c.darkBorder : c.border,
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 text-[#9A9AA2] hover:text-red-600 rounded transition-opacity flex-shrink-0"
            title="Notu Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[#6B6B76] dark:text-[#A1A1AA] line-clamp-4 leading-relaxed whitespace-pre-wrap">
        {snippet}
      </p>

      {/* Tags on card */}
      {attachedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {attachedTags.map((t) => (
            <span
              key={t.id}
              className="text-[10px] px-2 py-0.5 rounded-full border border-[#E8E4DE] dark:border-[#3F3F4E] bg-white/80 dark:bg-[#282833]/90 text-[#2E2E38] dark:text-[#EDEDF0] flex items-center gap-1.5 shadow-2xs"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span className="truncate max-w-[120px]">{t.name}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-2 border-t border-[#F0EDE8] dark:border-[#3F3F4E] flex items-center justify-between text-[11px] text-[#9A9AA2] dark:text-[#71717A]">
        <span>{new Date(standardNote.updatedAt).toLocaleDateString('tr-TR')}</span>
      </div>
    </Card>
  );
};
