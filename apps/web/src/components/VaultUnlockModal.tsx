import React, { useState } from 'react';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
} from '@pronotes/ui';
import { useVaultStore } from '../stores/vaultStore';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const { unlockVault, isVerifying, error, clearError } = useVaultStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) return;

    const ok = await unlockVault(password);
    if (ok) {
      setPassword('');
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8ECFB] flex items-center justify-center text-[#2F3A6B] mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-semibold">Gizli Kasa</DialogTitle>
          <DialogDescription className="text-sm text-[#6B6B76] max-w-sm">
            Kasanız AES-256-GCM ile uçtan uca şifrelenmiştir. Notlarınıza erişmek için Master Password'ünüzü girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUnlock} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-card">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#2E2E38]">Master Password (en az 8 karakter)</label>
            <div className="relative">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                autoFocus
                required
                minLength={8}
                className="pr-10"
              />
              <Lock className="w-4 h-4 text-[#9A9AA2] absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E8E4DE] p-3 rounded-card text-xs text-[#6B6B76] space-y-1">
            <span className="font-medium text-[#2E2E38] block">⚠️ Sıfır Bilgi (Zero-Knowledge) Prensibi:</span>
            Şifreniz asla sunucuya gitmez. Unutulması durumunda veriler kurtarılamaz. "Şifremi Unuttum" seçeneği yoktur.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isVerifying || password.length < 8}
              className="bg-[#2F3A6B] hover:bg-[#232c54] text-white"
            >
              {isVerifying ? 'Doğrulanıyor...' : 'Kilidi Aç'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
