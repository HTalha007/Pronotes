import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2 } from 'lucide-react';
import { Card, Badge } from '@pronotes/ui';
import { domain } from '@pronotes/core';
import { useVaultStore } from '../stores/vaultStore';
import { useNotesStore } from '../stores/notesStore';
import { useTagsStore } from '../stores/tagsStore';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';

interface NoteCardProps {
  note: domain.Note;
  onClick: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const { isUnlocked } = useVaultStore();
  const { deleteNote } = useNotesStore();
  const { tags } = useTagsStore();

  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null);
  const [decryptedSnippet, setDecryptedSnippet] = useState<string | null>(null);

  const isVault = note.kind === 'vault';

  useEffect(() => {
    if (isVault && isUnlocked) {
      const vaultNote = note as domain.VaultNote;
      const ivBase64 = btoa(String.fromCharCode(...vaultNote.encryptedPayload.iv));
      const cipherBase64 = btoa(String.fromCharCode(...vaultNote.encryptedPayload.ciphertext));

      cryptoWorkerClient
        .decryptVaultItem({
          iv: ivBase64,
          ciphertext: cipherBase64,
          salt: '',
          version: 1,
        })
        .then((plain) => {
          try {
            const parsed = JSON.parse(plain);
            setDecryptedTitle(parsed.title || 'Başlıksız Kasa Notu');
            setDecryptedSnippet(parsed.content ? parsed.content.replace(/<[^>]*>?/gm, '') : '');
          } catch {
            setDecryptedTitle('Kasa Notu');
            setDecryptedSnippet(plain.slice(0, 100));
          }
        })
        .catch(() => {
          setDecryptedTitle('Şifreli Kasa Notu');
          setDecryptedSnippet('Deşifre edilemedi.');
        });
    } else {
      setDecryptedTitle(null);
      setDecryptedSnippet(null);
    }
  }, [note, isVault, isUnlocked]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNote(note.id);
  };

  if (isVault) {
    return (
      <Card
        onClick={onClick}
        className="bg-[#FAFBFD] border-[#DCE4F9] hover:border-[#2F3A6B] relative group transition-all"
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
            <Lock className="w-3.5 h-3.5 text-[#2F3A6B]/70" />
          </div>
        </div>

        {isUnlocked ? (
          <div>
            <h3 className="font-medium text-sm text-[#2E2E38] line-clamp-1 mb-1">
              {decryptedTitle || 'Başlıksız Kasa Notu'}
            </h3>
            <p className="text-xs text-[#6B6B76] line-clamp-3">
              {decryptedSnippet || 'İçerik yok.'}
            </p>
          </div>
        ) : (
          <div className="py-3 text-center">
            <p className="text-xs font-medium text-[#2F3A6B]">Şifreli İçerik</p>
            <p className="text-[11px] text-[#9A9AA2] mt-0.5">Görmek için ana şifrenizi girin</p>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-[#E8ECFB] flex items-center justify-between text-[10px] text-[#9A9AA2]">
          <span>AES-256-GCM</span>
          <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
        </div>
      </Card>
    );
  }

  const standardNote = note as domain.StandardNote;
  const snippet = standardNote.plainText
    ? standardNote.plainText.replace(/<[^>]*>?/gm, '').trim()
    : 'İçerik yok.';

  const attachedTags = tags.filter((t) => standardNote.tagIds.includes(t.id));

  return (
    <Card onClick={onClick} className="relative group">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-sm text-[#2E2E38] line-clamp-1">
          {standardNote.title || 'Başlıksız Not'}
        </h3>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-[#9A9AA2] hover:text-red-600 rounded transition-opacity flex-shrink-0"
          title="Notu Sil"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-[#6B6B76] line-clamp-4 leading-relaxed whitespace-pre-wrap">
        {snippet}
      </p>

      {/* Tags on card */}
      {attachedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {attachedTags.map((t) => (
            <span
              key={t.id}
              className="text-[10px] px-2 py-0.5 rounded-full border border-[#E8E4DE] text-[#2E2E38] flex items-center gap-1"
              style={{ backgroundColor: t.color }}
            >
              <span>{t.name}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-2 border-t border-[#F0EDE8] flex items-center justify-between text-[11px] text-[#9A9AA2]">
        <span>{new Date(standardNote.updatedAt).toLocaleDateString('tr-TR')}</span>
      </div>
    </Card>
  );
};
