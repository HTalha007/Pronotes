import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Shield, Check, Tag as TagIcon, Palette, Share2, X, AlertTriangle } from 'lucide-react';
import * as Y from 'yjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Badge,
} from '@pronotes/ui';
import {
  domain,
  YjsDocumentManager,
  CrdtPersistenceCoordinator,
  registerLifecycleFlush,
} from '@pronotes/core';
import { useNotesStore } from '../stores/notesStore';
import { useVaultStore } from '../stores/vaultStore';
import { useTagsStore } from '../stores/tagsStore';
import { cryptoWorkerClient } from '../lib/crypto-worker-client';
import { NOTE_COLORS, getNoteColor } from '../lib/note-colors';
import { useThemeStore } from '../stores/themeStore';
import { ShareExportModal } from './ShareExportModal';
import { Editor } from './Editor';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: domain.Note | null;
  initialType?: 'standard' | 'vault';
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  note,
  initialType = 'standard',
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<domain.TagId[]>([]);
  const [color, setColor] = useState<string>('#FFFFFF');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const coordinatorRef = useRef<CrdtPersistenceCoordinator | null>(null);
  const unregisterLifecycleRef = useRef<(() => void) | null>(null);
  const titleRef = useRef(title);
  const tagsRef = useRef(selectedTagIds);
  const colorRef = useRef(color);

  titleRef.current = title;
  tagsRef.current = selectedTagIds;
  colorRef.current = color;

  const { createStandardNote, createVaultNote, updateNote, deleteNote, setDecryptedVaultItem } =
    useNotesStore();
  const { isUnlocked } = useVaultStore();
  const { tags } = useTagsStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const isVault = note ? note.kind === 'vault' : initialType === 'vault';
  const modalColor = getNoteColor(color, isDark);

  useEffect(() => {
    // Cleanup previous active coordinator / doc
    unregisterLifecycleRef.current?.();
    unregisterLifecycleRef.current = null;
    coordinatorRef.current?.destroy();
    coordinatorRef.current = null;

    if (!isOpen) {
      setDoc(null);
      return;
    }

    let activeDoc: Y.Doc | null = null;

    if (note) {
      if (note.kind === 'standard') {
        setTitle(note.title);
        setContent(note.plainText);
        setSelectedTagIds([...note.tagIds]);
        setColor(note.color || '#FFFFFF');

        const { doc: newDoc } = YjsDocumentManager.createNoteDoc(note.id, note.content);
        activeDoc = newDoc;
        setDoc(newDoc);

        // Setup 1.5s debounced persistence coordinator
        const coordinator = new CrdtPersistenceCoordinator({ debounceMs: 1500 });
        coordinator.attach(note.id, newDoc, async ({ snapshot, plainText }) => {
          const titleRes = domain.createNoteTitle(titleRef.current);
          await updateNote({
            ...note,
            title: titleRes.ok ? titleRes.value : note.title,
            plainText,
            content: domain.toCrdtState(snapshot),
            tagIds: tagsRef.current,
            color: colorRef.current,
          });
        });
        coordinatorRef.current = coordinator;
        unregisterLifecycleRef.current = registerLifecycleFlush(coordinator);
      } else if (note.kind === 'vault') {
        setSelectedTagIds([]);
        setColor('#FFFFFF');
        if (isUnlocked) {
          setIsDecrypting(true);
          const ivBase64 = btoa(String.fromCharCode(...note.encryptedPayload.iv));
          const cipherBase64 = btoa(String.fromCharCode(...note.encryptedPayload.ciphertext));

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
              let parsedTitle = '';
              let parsedContent = '';
              let initialSnapshot: Uint8Array | undefined;

              try {
                const parsed = JSON.parse(plain);
                parsedTitle = parsed.title || '';
                parsedContent = parsed.content || '';
                if (parsed.crdtState && Array.isArray(parsed.crdtState) && parsed.crdtState.length > 0) {
                  initialSnapshot = new Uint8Array(parsed.crdtState);
                }
              } catch {
                parsedContent = plain;
              }

              setTitle(parsedTitle);
              setContent(parsedContent);

              const { doc: newDoc } = YjsDocumentManager.createNoteDoc(note.id, initialSnapshot);
              activeDoc = newDoc;
              setDoc(newDoc);
            })
            .catch((err) => {
              console.error('Kasa notu deşifre edilemedi:', err);
            })
            .finally(() => setIsDecrypting(false));
        }
      }
    } else {
      // New note
      setTitle('');
      setContent('');
      setSelectedTagIds([]);
      setColor('#FFFFFF');

      const tempId = (domain.parseNoteId(crypto.randomUUID()).ok
        ? (domain.parseNoteId(crypto.randomUUID()) as { ok: true; value: domain.NoteId }).value
        : (`note-${Date.now()}` as domain.NoteId));

      const { doc: newDoc } = YjsDocumentManager.createNoteDoc(tempId);
      activeDoc = newDoc;
      setDoc(newDoc);
    }

    return () => {
      unregisterLifecycleRef.current?.();
      unregisterLifecycleRef.current = null;
      coordinatorRef.current?.destroy();
      coordinatorRef.current = null;
      activeDoc?.destroy();
    };
  }, [note, isOpen, isUnlocked]);

  const toggleTag = (tagId: domain.TagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSave = async () => {
    const currentText = doc ? YjsDocumentManager.extractPlainText(doc, 'content') : content;
    if (!title.trim() && !currentText.trim()) {
      onClose();
      return;
    }

    // Flush any pending debounced save
    if (coordinatorRef.current) {
      await coordinatorRef.current.flush();
    }

    const snapshot = doc ? YjsDocumentManager.createSnapshot(doc) : new Uint8Array(0);

    if (note) {
      if (note.kind === 'standard') {
        const titleRes = domain.createNoteTitle(title);
        await updateNote({
          ...note,
          title: titleRes.ok ? titleRes.value : note.title,
          plainText: currentText,
          content: domain.toCrdtState(snapshot),
          tagIds: selectedTagIds,
          color,
        });
      } else if (note.kind === 'vault') {
        const plainJson = JSON.stringify({
          title,
          content: currentText,
          crdtState: Array.from(snapshot),
        });
        const encryptedData = await cryptoWorkerClient.encryptVaultItem(plainJson, note.id);
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
        await updateNote({
          ...note,
          encryptedPayload: blob,
          updatedAt: new Date(),
        });
        setDecryptedVaultItem(note.id, { title, plainText: currentText });
      }
    } else {
      if (isVault) {
        await createVaultNote(title, currentText, snapshot);
      } else {
        await createStandardNote(title, currentText, selectedTagIds, snapshot, color);
      }
    }
    onClose();
  };

  const handleDelete = async () => {
    if (note) {
      await deleteNote(note.id);
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleSave()}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            titleInputRef.current?.focus();
          }}
          style={{ backgroundColor: isVault ? undefined : modalColor.bg }}
          className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 transition-colors duration-200"
        >
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8E4DE] dark:border-[#3F3F4E]">
            <div className="flex items-center gap-2">
              {isVault ? (
                <Badge variant="vault" className="gap-1.5 py-1 px-2.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Şifreli Kasa Notu</span>
                </Badge>
              ) : (
                <Badge variant="subtle" className="text-xs text-[#6B6B76] dark:text-[#A1A1AA] py-1 px-2.5">
                  Standart Not
                </Badge>
              )}

              {/* Share button placed in header alongside badge, completely isolated from X */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsShareModalOpen(true)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] text-[#6B6B76] dark:text-[#A1A1AA] hover:text-[#2E2E38] dark:hover:text-[#EDEDF0] hover:bg-[#F4F2EE] dark:hover:bg-[#282833] focus-visible:ring-2 focus-visible:ring-[#2E2E38] dark:focus-visible:ring-[#EDEDF0] focus:outline-none transition-colors"
                aria-label="Notu Paylaş veya Dışa Aktar"
                title="Paylaş veya Dışa Aktar"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Close button ALONE in top-right corner, in exact line with header */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="w-10 h-10 min-w-[40px] min-h-[40px] text-[#6B6B76] dark:text-[#A1A1AA] hover:text-[#2E2E38] dark:hover:text-[#EDEDF0] hover:bg-[#F4F2EE] dark:hover:bg-[#282833] focus-visible:ring-2 focus-visible:ring-[#2E2E38] dark:focus-visible:ring-[#EDEDF0] focus:outline-none transition-colors"
              aria-label="Notu Kaydet ve Kapat"
              title="Kapat (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          {isDecrypting ? (
            <div className="py-12 text-center text-sm text-[#6B6B76] dark:text-[#A1A1AA]">
              Kasa notu deşifre ediliyor...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <Input
                ref={titleInputRef}
                placeholder="Başlık..."
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent border-0 px-0 focus:ring-0 placeholder:text-[#9A9AA2] dark:placeholder:text-[#71717A] text-[#2E2E38] dark:text-[#EDEDF0]"
              />

            {/* Tag selector chips for standard notes */}
            {!isVault && tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <div className="flex items-center gap-1 text-[11px] text-[#6B6B76] dark:text-[#A1A1AA] mr-1">
                  <TagIcon className="w-3 h-3" />
                  <span>Etiketler:</span>
                </div>
                {tags.map((tag) => {
                  const isAttached = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                        isAttached
                          ? 'bg-[#2E2E38] dark:bg-[#EDEDF0] text-white dark:text-[#18181B] border-[#2E2E38] dark:border-[#EDEDF0] shadow-sm'
                          : 'bg-white/80 dark:bg-[#282833]/80 text-[#6B6B76] dark:text-[#A1A1AA] border-[#E8E4DE] dark:border-[#3F3F4E] hover:border-[#D5D0C8]'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isAttached ? (isDark ? '#18181B' : '#FFFFFF') : tag.color }}
                      />
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Color palette selector for standard notes */}
            {!isVault && (
              <div className="flex items-center gap-2 pt-1 pb-1">
                <div className="flex items-center gap-1 text-[11px] text-[#6B6B76] dark:text-[#A1A1AA] mr-1">
                  <Palette className="w-3 h-3" />
                  <span>Renk:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.bg)}
                      className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                        color.toLowerCase() === c.bg.toLowerCase()
                          ? 'ring-2 ring-[#2E2E38] dark:ring-[#EDEDF0] ring-offset-1 scale-110 shadow-xs'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: isDark ? c.darkBg : c.bg,
                        borderColor: isDark ? c.darkBorder : c.border,
                      }}
                      title={c.name}
                    >
                      {color.toLowerCase() === c.bg.toLowerCase() && (
                        <Check className="w-3 h-3 text-[#2E2E38] dark:text-[#EDEDF0]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Editor
              doc={doc}
              content={content}
              onChange={setContent}
              placeholder="Notunuzu yazın... (* liste, ``` kod)"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#E8E4DE] dark:border-[#3F3F4E]">
          <div className="flex items-center gap-2">
            {note && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none transition-colors"
                aria-label="Notu Sil"
                title="Notu Sil"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <span className="text-xs text-[#9A9AA2] dark:text-[#71717A]">
              CRDT ile yerel IndexedDB'ye kaydedilir
            </span>
          </div>

          <Button
            onClick={handleSave}
            className="gap-1.5 min-h-[40px] px-4 font-medium"
            aria-label="Notu Kaydet ve Kapat"
          >
            <Check className="w-4 h-4" />
            <span>Bitti</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={(open: boolean) => setIsDeleteDialogOpen(open)}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-semibold text-[#2E2E38] dark:text-[#EDEDF0]">
            Notu Silmek İstiyor Musunuz?
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B6B76] dark:text-[#A1A1AA] max-w-xs mt-1">
            Bu işlem notu yerel IndexedDB veritabanından kalıcı olarak kaldıracaktır. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E4DE] dark:border-[#3F3F4E]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsDeleteDialogOpen(false)}
            className="min-h-[40px] px-4"
            autoFocus
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={async () => {
              setIsDeleteDialogOpen(false);
              await handleDelete();
            }}
            className="bg-red-600 hover:bg-red-700 text-white min-h-[40px] px-4"
          >
            Evet, Sil
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <ShareExportModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      title={title}
      content={doc ? YjsDocumentManager.extractPlainText(doc, 'content') : content}
      tagNames={tags.filter((t) => selectedTagIds.includes(t.id)).map((t) => t.name)}
      isVault={isVault}
    />
  </>
  );
};
