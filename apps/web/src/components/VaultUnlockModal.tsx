import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, KeyRound } from 'lucide-react';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isInitialized, setupVault, unlockVault, resetVault, isVerifying, error, clearError } =
    useVaultStore();

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setValidationError(null);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!password || password.length < 8) {
      setValidationError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (!isInitialized) {
      if (password !== confirmPassword) {
        setValidationError('Girdiğiniz şifreler eşleşmiyor.');
        return;
      }

      const ok = await setupVault(password);
      if (ok) {
        setPassword('');
        setConfirmPassword('');
        onSuccess();
        onClose();
      }
    } else {
      const ok = await unlockVault(password);
      if (ok) {
        setPassword('');
        onSuccess();
        onClose();
      }
    }
  };

  const activeError = validationError || error;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8ECFB] flex items-center justify-center text-[#2F3A6B] mb-2">
            {isInitialized ? <Shield className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {isInitialized ? 'Gizli Kasa' : 'Gizli Kasa Kurulumu'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B6B76] max-w-sm">
            {isInitialized
              ? 'Kasanız AES-256-GCM ile uçtan uca şifrelenmiştir. Notlarınıza erişmek için Master Password\'ünüzü girin.'
              : 'Kasanızı ilk kez oluşturuyorsunuz. Uçtan uca şifreleme için en az 8 karakterlik güçlü bir Master Password belirleyin.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {activeError && (
            <div className="flex flex-col gap-1.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm rounded-card">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{activeError}</span>
              </div>
              {isInitialized && (
                <button
                  type="button"
                  onClick={() => {
                    resetVault();
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline text-left mt-0.5 cursor-pointer font-medium"
                >
                  Şifreyi unuttuysanız: Kasayı Sıfırla ve Yeni Şifre Belirle
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#2E2E38]">
              {isInitialized ? 'Master Password' : 'Yeni Master Password (en az 8 karakter)'}
            </label>
            <div className="relative">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
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

          {!isInitialized && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#2E2E38]">Master Password'ü Onayla</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfirmPassword(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Lock className="w-4 h-4 text-[#9A9AA2] absolute right-3 top-2.5" />
              </div>
            </div>
          )}

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
              disabled={
                isVerifying ||
                password.length < 8 ||
                (!isInitialized && confirmPassword.length < 8)
              }
              className="bg-[#2F3A6B] hover:bg-[#232c54] text-white"
            >
              {isVerifying
                ? 'İşleniyor...'
                : isInitialized
                ? 'Kilidi Aç'
                : 'Kasayı Oluştur ve Aç'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
