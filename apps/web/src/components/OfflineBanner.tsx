import React, { useEffect } from 'react';
import { WifiOff, X, CheckCircle2 } from 'lucide-react';
import { useNetworkStore } from '../stores/networkStore';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, isBannerDismissed, dismissBanner, resetWasOffline } =
    useNetworkStore();

  // Auto-dismiss the "reconnected" green banner after 3.5 seconds
  useEffect(() => {
    if (!isOnline || !wasOffline) {
      return;
    }
    const timer = setTimeout(() => {
      resetWasOffline();
    }, 3500);
    return () => clearTimeout(timer);
  }, [isOnline, wasOffline, resetWasOffline]);

  if (isOnline && !wasOffline) {
    return null;
  }

  // Back online banner (Green)
  if (isOnline && wasOffline) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/50 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 transition-all duration-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Yeniden Çevrimiçisiniz:</strong> İnternet bağlantısı sağlandı. Yerel notlarınız güvende.
          </span>
        </div>
        <button
          onClick={resetWasOffline}
          className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-100 rounded transition-colors"
          title="Kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Offline banner (Amber)
  if (!isOnline && !isBannerDismissed) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 transition-all duration-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>
            <strong>Çevrimdışı Mod:</strong> İnternet bağlantısı yok. Notlarınız CRDT ve IndexedDB ile yerel olarak kaydedilmektedir.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={dismissBanner}
            className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-100 rounded transition-colors"
            title="Uyarıyı Gizle"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
