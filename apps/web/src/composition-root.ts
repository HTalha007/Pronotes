import {
  domain,
  infrastructure,
} from '@pronotes/core';
import { browserNavigation } from './lib/browser-navigation-adapter';
import { cryptoWorkerClient } from './lib/crypto-worker-client';
import {
  LocalSimulatedAuthGateway,
  LocalSimulatedSyncGateway,
} from './lib/simulated-cloud-gateway';

const {
  CreateStandardNote,
  UpdateStandardNote,
  DeleteNote,
  ListNotes,
  SearchNotes,
  CreateTag,
  ListTags,
  DeleteTag,
  UpdateTag,
  NavigateTo,
  GetCurrentRoute,
  SynchronizeNotes,
  SignUp,
  SignIn,
  SignOut,
  GetCurrentUser,
  parseNoteId,
  parseTagId,
  parseUserId,
} = domain;

const {
  openPronotesDb,
  IndexedDbNoteRepository,
  IndexedDbTagRepository,
  IndexedDbVaultRepository,
  initFirebase,
  FirebaseAuthGateway,
  FirestoreSyncGateway,
} = infrastructure;

// Default local user ID for offline-first usage without mandatory login
export const LOCAL_USER_ID = parseUserId('local-user').ok
  ? (parseUserId('local-user') as { ok: true; value: domain.UserId }).value
  : ('local-user' as domain.UserId);

const idGenerator: domain.IdGenerator = {
  newNoteId: () => {
    const res = parseNoteId(crypto.randomUUID());
    return res.ok ? res.value : ('note-' + Date.now() as domain.NoteId);
  },
  newTagId: () => {
    const res = parseTagId(crypto.randomUUID());
    return res.ok ? res.value : ('tag-' + Date.now() as domain.TagId);
  },
};

const clock: domain.Clock = {
  now: () => new Date(),
};

// Singleton composition root
class CompositionRoot {
  private dbPromise: Promise<infrastructure.PronotesDb> | null = null;
  public noteRepo: infrastructure.IndexedDbNoteRepository | null = null;
  public tagRepo: infrastructure.IndexedDbTagRepository | null = null;
  public vaultRepo: infrastructure.IndexedDbVaultRepository | null = null;

  public createStandardNote!: domain.CreateStandardNote;
  public updateStandardNote!: domain.UpdateStandardNote;
  public deleteNote!: domain.DeleteNote;
  public listNotes!: domain.ListNotes;
  public searchNotes!: domain.SearchNotes;

  public createTag!: domain.CreateTag;
  public listTags!: domain.ListTags;
  public deleteTag!: domain.DeleteTag;
  public updateTag!: domain.UpdateTag;

  public authGateway: domain.AuthGateway | null = null;
  public syncGateway: domain.SyncGateway | null = null;
  public isCloudSimulated: boolean = true;
  public synchronizeNotes: domain.SynchronizeNotes | null = null;
  public signUp: domain.SignUp | null = null;
  public signIn: domain.SignIn | null = null;
  public signOut: domain.SignOut | null = null;
  public getCurrentUser: domain.GetCurrentUser | null = null;

  public navigateTo: domain.NavigateTo = new NavigateTo(browserNavigation);
  public getCurrentRoute: domain.GetCurrentRoute = new GetCurrentRoute(browserNavigation);

  async init(): Promise<void> {
    if (!this.dbPromise) {
      this.dbPromise = openPronotesDb();
    }
    const db = await this.dbPromise;

    this.noteRepo = new IndexedDbNoteRepository(db);
    this.tagRepo = new IndexedDbTagRepository(db);
    this.vaultRepo = new IndexedDbVaultRepository(db);

    this.createStandardNote = new CreateStandardNote(this.noteRepo, idGenerator, clock);
    this.updateStandardNote = new UpdateStandardNote(this.noteRepo, clock);
    this.deleteNote = new DeleteNote(this.noteRepo, clock);
    this.listNotes = new ListNotes(this.noteRepo);
    this.searchNotes = new SearchNotes(this.noteRepo);

    this.createTag = new CreateTag(this.tagRepo, idGenerator, clock);
    this.listTags = new ListTags(this.tagRepo);
    this.deleteTag = new DeleteTag(this.tagRepo, clock);
    this.updateTag = new UpdateTag(this.tagRepo, clock);

    const connectivity: domain.ConnectivityMonitor = {
      isOnline: () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
    };

    const vaultCipherAdapter: domain.VaultCipher = {
      createKdfParams: async () => {
        const salt = new Uint8Array(16);
        crypto.getRandomValues(salt);
        const params = domain.createKdfParams(100_000, salt);
        if (!params.ok) throw params.error;
        return params.value;
      },
      unlock: async () => {},
      lock: async () => {
        await cryptoWorkerClient.lockVault();
      },
      isUnlocked: async () => cryptoWorkerClient.isUnlocked(),
      encrypt: async (plaintext: Uint8Array, aad?: Uint8Array) => {
        try {
          const isUnlocked = await cryptoWorkerClient.isUnlocked();
          if (!isUnlocked) return domain.err(new domain.VaultLockedError());
          const text = domain.utf8Decode(plaintext);
          const aadStr = aad ? domain.utf8Decode(aad) : undefined;
          const res = await cryptoWorkerClient.encryptVaultItem(text, aadStr);
          const blob: domain.EncryptedBlob = {
            version: 1,
            alg: 'AES-GCM',
            iv: new Uint8Array(atob(res.iv).split('').map((c) => c.charCodeAt(0))),
            ciphertext: new Uint8Array(atob(res.ciphertext).split('').map((c) => c.charCodeAt(0))),
          };
          return domain.ok(blob);
        } catch {
          return domain.err(new domain.VaultLockedError());
        }
      },
      decrypt: async (blob: domain.EncryptedBlob, aad?: Uint8Array) => {
        try {
          const isUnlocked = await cryptoWorkerClient.isUnlocked();
          if (!isUnlocked) return domain.err(new domain.VaultLockedError());
          const ivBase64 = btoa(String.fromCharCode(...blob.iv));
          const cipherBase64 = btoa(String.fromCharCode(...blob.ciphertext));
          const aadStr = aad ? domain.utf8Decode(aad) : undefined;
          const decryptedStr = await cryptoWorkerClient.decryptVaultItem(
            {
              version: 1,
              iv: ivBase64,
              ciphertext: cipherBase64,
              salt: '',
            },
            aadStr,
          );
          return domain.ok(domain.utf8Encode(decryptedStr));
        } catch {
          return domain.err(new domain.DecryptionFailedError());
        }
      },
    };

    // Initialize Firebase if a valid API key is configured; otherwise use Local Simulated Cloud
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (apiKey && apiKey !== 'your-api-key') {
      const firebaseConfig: infrastructure.FirebaseConfig = {
        apiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      };

      const firebaseServices = initFirebase(firebaseConfig);
      this.authGateway = new FirebaseAuthGateway(firebaseServices.auth);
      this.syncGateway = new FirestoreSyncGateway({
        firestore: firebaseServices.firestore,
        noteRepo: this.noteRepo,
        tagRepo: this.tagRepo,
        connectivity,
      });
      this.isCloudSimulated = false;
    } else {
      this.authGateway = new LocalSimulatedAuthGateway();
      this.syncGateway = new LocalSimulatedSyncGateway(this.noteRepo, this.tagRepo, connectivity);
      this.isCloudSimulated = true;
    }

    this.synchronizeNotes = new SynchronizeNotes(this.syncGateway, connectivity);
    this.signUp = new SignUp(this.authGateway);
    this.signIn = new SignIn(this.authGateway);
    this.signOut = new SignOut(this.authGateway, vaultCipherAdapter);
    this.getCurrentUser = new GetCurrentUser(this.authGateway);
  }
}

export const compositionRoot = new CompositionRoot();
