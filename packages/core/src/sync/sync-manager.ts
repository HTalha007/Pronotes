export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface SyncEventListener {
  (status: SyncStatus): void;
}

export class SyncManager {
  private status: SyncStatus = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
  private listeners: Set<SyncEventListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private handleNetworkChange(isOnline: boolean): void {
    this.status = isOnline ? 'online' : 'offline';
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.status);
    }
  }

  public setStatus(newStatus: SyncStatus): void {
    this.status = newStatus;
    this.notifyListeners();
  }
}
