import React from 'react';
import { Search, Plus, Cloud, RefreshCw, LogOut, User as UserIcon } from 'lucide-react';
import { Button, Input } from '@pronotes/ui';
import { useNotesStore } from '../stores/notesStore';
import { useAuthStore } from '../stores/authStore';

interface HeaderProps {
  onNewStandardNote: () => void;
  onNewVaultNote: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewStandardNote,
  onNewVaultNote,
  onOpenAuthModal,
}) => {
  const { searchQuery, setSearchQuery, activeFilter } = useNotesStore();
  const { user, isSyncing, syncNow, signOut } = useAuthStore();

  return (
    <header className="h-14 border-b border-[#E8E4DE] bg-white px-6 flex items-center justify-between gap-4 flex-shrink-0">
      {/* Search Input */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 text-[#9A9AA2] absolute left-3 top-3 pointer-events-none" />
        <Input
          type="text"
          placeholder={
            activeFilter === 'vault'
              ? 'Kasa notlarında ara (yalnızca yerel)...'
              : 'Notlarda ara...'
          }
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-9 bg-[#FAF8F5] border-[#E8E4DE] text-xs h-9"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Sync & Auth Status Button */}
        {user ? (
          <div className="flex items-center gap-1.5 mr-2">
            <Button
              size="sm"
              variant="outline"
              onClick={syncNow}
              disabled={isSyncing}
              className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 h-8"
              title="Firestore ile senkronize et"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Eşitleniyor...' : 'Eşitlendi'}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={signOut}
              className="text-xs text-[#6B6B76] hover:text-red-600 gap-1 h-8"
              title={`${user.email} (Çıkış Yap)`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAuthModal}
            className="text-xs text-[#2F3A6B] border-[#D0D9F5] hover:bg-[#E8ECFB] gap-1.5 h-8 mr-2"
            title="Bulut senkronizasyonu için giriş yapın"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buluta Eşitle</span>
          </Button>
        )}

        {activeFilter === 'vault' ? (
          <Button
            size="sm"
            onClick={onNewVaultNote}
            className="bg-[#2F3A6B] hover:bg-[#232c54] text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kasa Notu</span>
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onNewVaultNote}
              className="gap-1.5 text-xs text-[#2F3A6B] border-[#D0D9F5] hover:bg-[#E8ECFB]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kasa Notu</span>
            </Button>
            <Button size="sm" onClick={onNewStandardNote} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Yeni Not</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
