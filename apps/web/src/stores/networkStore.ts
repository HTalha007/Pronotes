import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  resetWasOffline: () => void;
  setOnlineStatus: (status: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  wasOffline: false,
  isBannerDismissed: false,

  dismissBanner: () => set({ isBannerDismissed: true }),

  resetWasOffline: () => set({ wasOffline: false }),

  setOnlineStatus: (isOnline: boolean) => {
    const prev = get().isOnline;
    if (prev && !isOnline) {
      // Transitioned from online to offline
      set({ isOnline: false, wasOffline: true, isBannerDismissed: false });
    } else if (!prev && isOnline) {
      // Transitioned from offline to online
      set({ isOnline: true });
    } else {
      set({ isOnline });
    }
  },
}));

// Initialize window network event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useNetworkStore.getState().setOnlineStatus(true);
  });
  window.addEventListener('offline', () => {
    useNetworkStore.getState().setOnlineStatus(false);
  });
}
