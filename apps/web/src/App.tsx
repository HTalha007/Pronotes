import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { AuthModal } from './components/AuthModal';
import { useNotesStore } from './stores/notesStore';
import { useVaultStore } from './stores/vaultStore';
import { useTagsStore } from './stores/tagsStore';
import { useNavigationStore } from './stores/navigationStore';
import { useAuthStore } from './stores/authStore';
import { domain } from '@pronotes/core';
import { Shield, FilePlus } from 'lucide-react';
import { Button } from '@pronotes/ui';

export function App() {
  const { notes, activeFilter, searchQuery, loadNotes, setActiveFilter } = useNotesStore();
  const { isUnlocked } = useVaultStore();
  const { selectedTagId, setSelectedTagId } = useTagsStore();
  const { currentRoute, navigateTo } = useNavigationStore();
  const { initializeAuth } = useAuthStore();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'standard' | 'vault'>('standard');
  const [selectedNote, setSelectedNote] = useState<domain.Note | null>(null);
  const [isVaultUnlockOpen, setIsVaultUnlockOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    loadNotes();
    initializeAuth();
  }, [loadNotes, initializeAuth]);

  // Synchronize route changes to store & modals
  useEffect(() => {
    switch (currentRoute.kind) {
      case 'all-notes':
        setActiveFilter('all');
        setSelectedTagId(null);
        setIsNoteModalOpen(false);
        break;
      case 'vault':
        setActiveFilter('vault');
        setSelectedTagId(null);
        setIsNoteModalOpen(false);
        if (!isUnlocked) {
          setIsVaultUnlockOpen(true);
        }
        break;
      case 'tag':
        setActiveFilter('all');
        setSelectedTagId(currentRoute.tagId);
        setIsNoteModalOpen(false);
        break;
      case 'note-detail': {
        const found = notes.find((n) => n.id === currentRoute.noteId);
        if (found) {
          if (found.kind === 'vault' && !isUnlocked) {
            setIsVaultUnlockOpen(true);
          } else {
            setSelectedNote(found);
            setModalInitialType(found.kind);
            setIsNoteModalOpen(true);
          }
        }
        break;
      }
    }
  }, [currentRoute, notes, isUnlocked, setActiveFilter, setSelectedTagId]);

  const handleOpenStandardNote = (note?: domain.Note) => {
    setSelectedNote(note || null);
    setModalInitialType('standard');
    setIsNoteModalOpen(true);
    if (note) {
      navigateTo({ kind: 'note-detail', noteId: note.id });
    }
  };

  const handleOpenVaultNote = (note?: domain.Note) => {
    if (!isUnlocked) {
      setIsVaultUnlockOpen(true);
      return;
    }
    setSelectedNote(note || null);
    setModalInitialType('vault');
    setIsNoteModalOpen(true);
    if (note) {
      navigateTo({ kind: 'note-detail', noteId: note.id });
    }
  };

  const handleNoteClick = (note: domain.Note) => {
    navigateTo({ kind: 'note-detail', noteId: note.id });
  };

  // Filter notes based on active tab, tag filter, and search query
  const filteredNotes = notes.filter((note) => {
    if (activeFilter === 'vault' && note.kind !== 'vault') return false;

    // Filter by tag if selected
    if (selectedTagId) {
      if (note.kind !== 'standard') return false;
      if (!note.tagIds.includes(selectedTagId)) return false;
    }

    if (searchQuery.trim()) {
      if (note.kind === 'standard') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.plainText.toLowerCase().includes(query);
        return matchesTitle || matchesContent;
      }
      return true;
    }

    return true;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper">
      {/* 232px Sidebar with Tag management */}
      <Sidebar onOpenVaultModal={() => setIsVaultUnlockOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onNewStandardNote={() => handleOpenStandardNote()}
          onNewVaultNote={() => handleOpenVaultNote()}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-6">
              <div className="w-12 h-12 rounded-full bg-[#F4F2EE] border border-[#E8E4DE] flex items-center justify-center text-[#6B6B76] mb-3">
                {activeFilter === 'vault' ? (
                  <Shield className="w-5 h-5 text-[#2F3A6B]" />
                ) : (
                  <FilePlus className="w-5 h-5" />
                )}
              </div>
              <h2 className="text-base font-semibold text-[#2E2E38] mb-1">
                {activeFilter === 'vault'
                  ? 'Kasa Boş'
                  : selectedTagId
                  ? 'Bu etikete ait not yok'
                  : 'Henüz not yok'}
              </h2>
              <p className="text-xs text-[#6B6B76] mb-4">
                {activeFilter === 'vault'
                  ? 'Uçtan uca şifreli ilk gizli notunuzu oluşturun.'
                  : 'Fikirlerinizi, kod parçalarını veya yapılacakları hemen yerel veritabanına kaydedin.'}
              </p>
              <Button
                size="sm"
                onClick={
                  activeFilter === 'vault'
                    ? () => handleOpenVaultNote()
                    : () => handleOpenStandardNote()
                }
                className={activeFilter === 'vault' ? 'bg-[#2F3A6B] hover:bg-[#232c54]' : ''}
              >
                {activeFilter === 'vault' ? 'Yeni Kasa Notu Oluştur' : 'Yeni Not Ekle'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => handleNoteClick(note)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Note Editor Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedNote(null);
          navigateTo(selectedTagId ? { kind: 'tag', tagId: selectedTagId } : { kind: 'all-notes' });
        }}
        note={selectedNote}
        initialType={modalInitialType}
      />

      {/* Vault Unlock Modal */}
      <VaultUnlockModal
        isOpen={isVaultUnlockOpen}
        onClose={() => setIsVaultUnlockOpen(false)}
        onSuccess={() => {
          setIsVaultUnlockOpen(false);
        }}
      />

      {/* Cloud Sync & Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;
