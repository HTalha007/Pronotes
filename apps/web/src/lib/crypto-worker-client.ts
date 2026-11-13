import type { EncryptedPayload } from '@pronotes/core';

class CryptoWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(
        new URL('../workers/crypto.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, success, result, error } = e.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
          this.pendingRequests.delete(id);
        }
      };
    }
  }

  private sendRequest<T>(action: string, payload: any = {}): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Web Worker başlatılamadı.'));
    }

    const id = Math.random().toString(36).substring(2, 9);
    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({ id, action, payload });
    });
  }

  public async setupVault(password: string): Promise<{ saltBase64: string; verifierPayload: EncryptedPayload }> {
    return this.sendRequest<{ saltBase64: string; verifierPayload: EncryptedPayload }>('setupVault', { password });
  }

  public async unlockVault(
    password: string,
    saltBase64?: string,
    verifierPayload?: EncryptedPayload,
  ): Promise<{ saltBase64: string; verifierPayload?: EncryptedPayload }> {
    return this.sendRequest<{ saltBase64: string; verifierPayload?: EncryptedPayload }>('unlockVault', {
      password,
      saltBase64,
      verifierPayload,
    });
  }

  public async lockVault(): Promise<void> {
    return this.sendRequest<void>('lockVault');
  }

  public async isUnlocked(): Promise<boolean> {
    const res = await this.sendRequest<{ unlocked: boolean }>('isUnlocked');
    return res.unlocked;
  }

  public async encryptVaultItem(plainText: string, aad?: string): Promise<EncryptedPayload> {
    return this.sendRequest<EncryptedPayload>('encryptVaultItem', { plainText, aad });
  }

  public async decryptVaultItem(encryptedPayload: EncryptedPayload, aad?: string): Promise<string> {
    return this.sendRequest<string>('decryptVaultItem', { encryptedPayload, aad });
  }
}

export const cryptoWorkerClient = new CryptoWorkerClient();
