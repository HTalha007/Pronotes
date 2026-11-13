import React, { useState } from 'react';
import { Cloud, Check, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Button,
  Input,
} from '@pronotes/ui';
import { useAuthStore } from '../stores/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signUp, signIn, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const success = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

    if (success) {
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  const handleToggleMode = () => {
    clearError();
    setIsSignUp(!isSignUp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8E4DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E8ECFB] flex items-center justify-center text-[#2F3A6B]">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#2E2E38]">
                {isSignUp ? 'Hesap Oluştur & Senkronize Et' : 'Oturum Aç & Senkronize Et'}
              </h2>
              <p className="text-[11px] text-[#6B6B76]">
                Notlarınıza tüm cihazlarınızdan güvenle erişin
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#2E2E38]">E-posta Adresi</label>
            <Input
              type="email"
              placeholder="ornek@alanadi.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              autoFocus
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#2E2E38]">Şifre</label>
            <Input
              type="password"
              placeholder="En az 8 karakter..."
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full gap-2">
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>İşlem Yapılıyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isSignUp ? 'Hesap Oluştur ve Eşitle' : 'Giriş Yap ve Eşitle'}</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={handleToggleMode}
              className="text-xs text-[#2F3A6B] hover:underline text-center pt-1"
            >
              {isSignUp
                ? 'Zaten bir hesabınız var mı? Giriş yapın'
                : 'Hesabınız yok mu? Hemen kayıt olun'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
