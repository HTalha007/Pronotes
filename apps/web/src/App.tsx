import { useEffect, useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { AuthModal } from './components/AuthModal';
import { SharedNoteViewer } from './components/SharedNoteViewer';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { OfflineBanner } from './components/OfflineBanner';
import { parseSharedNoteFromUrl, SharedNoteData } from './lib/note-export';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNotesStore } from './stores/notesStore';
import { useVaultStore } from './stores/vaultStore';
import { useTagsStore } from './stores/tagsStore';
import { useNavigationStore } from './stores/navigationStore';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { domain } from '@pronotes/core';
import { Shield, FilePlus, Lock } from 'lucide-react';
import { Button } from '@pronotes/ui';

export function App() {
  const { notes, activeFilter, searchQuery, loadNotes, setActiveFilter, decryptedVaultCache } =
    useNotesStore();
  const { isUnlocked } = useVaultStore();
  const { selectedTagId, setSelectedTagId } = useTagsStore();
  const { currentRoute, navigateTo } = useNavigationStore();
  const { initializeAuth } = useAuthStore();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'standard' | 'vault'>('standard');
  const [selectedNote, setSelectedNote] = useState<domain.Note | null>(null);
  const [isVaultUnlockOpen, setIsVaultUnlockOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [sharedNoteData, setSharedNoteData] = useState<SharedNoteData | null>(() =>
    parseSharedNoteFromUrl(),
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { lockVault } = useVaultStore();
  const { toggleTheme } = useThemeStore();

  useKeyboardShortcuts(
    {
      onNewStandardNote: () => handleOpenStandardNote(),
      onNewVaultNote: () => handleOpenVaultNote(),
      onToggleVault: () => {
        if (isUnlocked) {
          lockVault();
        } else {
          setIsVaultUnlockOpen(true);
        }
      },
      onFocusSearch: () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      },
      onOpenShortcutsHelp: () => setIsShortcutsHelpOpen(true),
      onToggleTheme: () => toggleTheme(),
    },
    !isNoteModalOpen && !isVaultUnlockOpen && !isAuthModalOpen && !isShortcutsHelpOpen && !sharedNoteData,
  );

  useEffect(() => {
    const handleHashChange = () => {
      setSharedNoteData(parseSharedNoteFromUrl());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      const query = searchQuery.toLowerCase();
      if (note.kind === 'standard') {
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.plainText.toLowerCase().includes(query);
        return matchesTitle || matchesContent;
      } else if (note.kind === 'vault') {
        if (!isUnlocked) return false;
        const cached = decryptedVaultCache[note.id];
        if (cached) {
          const matchesTitle = cached.title.toLowerCase().includes(query);
          const matchesContent = cached.plainText.toLowerCase().includes(query);
          return matchesTitle || matchesContent;
        }
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper dark:bg-[#18181B] text-[#2E2E38] dark:text-[#EDEDF0] transition-colors">
      {/* 232px Sidebar with Tag management */}
      <Sidebar onOpenVaultModal={() => setIsVaultUnlockOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onNewStandardNote={() => handleOpenStandardNote()}
          onNewVaultNote={() => handleOpenVaultNote()}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
          searchInputRef={searchInputRef}
        />

        {/* Offline / Reconnected Banner */}
        <OfflineBanner />

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeFilter === 'vault' && !isUnlocked ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-6">
              <div className="w-16 h-16 rounded-full bg-[#E8ECFB] dark:bg-[#1E294A] border border-[#DCE4F9] dark:border-[#2D3E70] flex items-center justify-center text-[#2F3A6B] dark:text-[#93A5F8] mb-4 shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-[#2E2E38] dark:text-[#EDEDF0] mb-1.5">Gizli Kasa Kilitli</h2>
              <p className="text-xs text-[#6B6B76] dark:text-[#A1A1AA] mb-5 leading-relaxed">
                Kasanız AES-256-GCM ile uçtan uca şifrelenmiştir. Notlarınızı görmek ve yeni şifreli not eklemek için kilidi açın.
              </p>
              <Button
                size="sm"
                onClick={() => setIsVaultUnlockOpen(true)}
                className="bg-[#2F3A6B] hover:bg-[#232c54] text-white px-5 gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Kasanın Kilidini Aç</span>
              </Button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-6">
              <div className="w-12 h-12 rounded-full bg-[#F4F2EE] dark:bg-[#282833] border border-[#E8E4DE] dark:border-[#3F3F4E] flex items-center justify-center text-[#6B6B76] dark:text-[#A1A1AA] mb-3">
                {activeFilter === 'vault' ? (
                  <Shield className="w-5 h-5 text-[#2F3A6B] dark:text-[#93A5F8]" />
                ) : (
                  <FilePlus className="w-5 h-5" />
                )}
              </div>
              <h2 className="text-base font-semibold text-[#2E2E38] dark:text-[#EDEDF0] mb-1">
                {activeFilter === 'vault'
                  ? 'Kasa Boş'
                  : selectedTagId
                  ? 'Bu etikete ait not yok'
                  : 'Henüz not yok'}
              </h2>
              <p className="text-xs text-[#6B6B76] dark:text-[#A1A1AA] mb-4">
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

      {/* Read-Only Shared Note Viewer */}
      {sharedNoteData && (
        <SharedNoteViewer
          noteData={sharedNoteData}
          onClose={() => {
            window.location.hash = '';
            setSharedNoteData(null);
          }}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}

export default App;
