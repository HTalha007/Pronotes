import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Shield, Check, Tag as TagIcon } from 'lucide-react';
import * as Y from 'yjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  const [isDecrypting, setIsDecrypting] = useState(false);

  const coordinatorRef = useRef<CrdtPersistenceCoordinator | null>(null);
  const unregisterLifecycleRef = useRef<(() => void) | null>(null);
  const titleRef = useRef(title);
  const tagsRef = useRef(selectedTagIds);

  titleRef.current = title;
  tagsRef.current = selectedTagIds;

  const { createStandardNote, createVaultNote, updateNote, deleteNote } = useNotesStore();
  const { isUnlocked } = useVaultStore();
  const { tags } = useTagsStore();

  const isVault = note ? note.kind === 'vault' : initialType === 'vault';

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
          });
        });
        coordinatorRef.current = coordinator;
        unregisterLifecycleRef.current = registerLifecycleFlush(coordinator);
      } else if (note.kind === 'vault') {
        setSelectedTagIds([]);
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
      }
    } else {
      if (isVault) {
        await createVaultNote(title, currentText, snapshot);
      } else {
        await createStandardNote(title, currentText, selectedTagIds, snapshot);
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
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleSave()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#E8E4DE]">
          <div className="flex items-center gap-2">
            {isVault ? (
              <Badge variant="vault" className="gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Şifreli Kasa Notu
              </Badge>
            ) : (
              <span className="text-xs text-[#6B6B76]">Standart Not</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {note && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Notu yerel veritabanından sil"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {isDecrypting ? (
          <div className="py-12 text-center text-sm text-[#6B6B76]">
            Kasa notu deşifre ediliyor...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <Input
              placeholder="Başlık..."
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-0 px-0 focus:ring-0 placeholder:text-[#9A9AA2]"
            />

            {/* Tag selector chips for standard notes */}
            {!isVault && tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <div className="flex items-center gap-1 text-[11px] text-[#6B6B76] mr-1">
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
                          ? 'bg-[#2E2E38] text-white border-[#2E2E38] shadow-sm'
                          : 'bg-[#FAF8F5] text-[#6B6B76] border-[#E8E4DE] hover:border-[#D5D0C8]'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isAttached ? '#FFFFFF' : tag.color }}
                      />
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
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

        <div className="flex items-center justify-between pt-4 border-t border-[#E8E4DE]">
          <span className="text-xs text-[#9A9AA2]">CRDT ile yerel IndexedDB'ye kaydedilir</span>
          <Button onClick={handleSave} className="gap-1.5">
            <Check className="w-4 h-4" />
            Bitti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
