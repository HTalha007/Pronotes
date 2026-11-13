import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  base64ToBytes,
  bytesToBase64,
  createNoteTitle,
  createTagColor,
  createTagName,
  DEFAULT_TAG_COLOR,
  err,
  ok,
  parseNoteId,
  parseTagId,
  SyncFailedError,
  toCrdtState,
  type ConnectivityMonitor,
  type EncryptedBlob,
  type Note,
  type NoteRepository,
  type Result,
  type StandardNote,
  type SyncGateway,
  type SyncReport,
  type Tag,
  type TagColor,
  type TagId,
  type TagRepository,
  type UserId,
  type VaultNote,
} from '../../../domain';

export interface FirestoreSyncGatewayOptions {
  readonly firestore: Firestore;
  readonly noteRepo: NoteRepository;
  readonly tagRepo: TagRepository;
  readonly connectivity?: ConnectivityMonitor;
}

export class FirestoreSyncGateway implements SyncGateway {
  private readonly firestore: Firestore;
  private readonly noteRepo: NoteRepository;
  private readonly tagRepo: TagRepository;
  private readonly connectivity?: ConnectivityMonitor;

  constructor(options: FirestoreSyncGatewayOptions) {
    this.firestore = options.firestore;
    this.noteRepo = options.noteRepo;
    this.tagRepo = options.tagRepo;
    this.connectivity = options.connectivity;
  }

  async synchronize(ownerId: UserId): Promise<Result<SyncReport, SyncFailedError>> {
    // 1. If offline, gracefully skip sync
    if (this.connectivity && !this.connectivity.isOnline()) {
      return ok({ pushed: 0, pulled: 0 });
    }

    try {
      let pushed = 0;
      let pulled = 0;

      const notesColRef = collection(this.firestore, 'users', ownerId, 'notes');
      const tagsColRef = collection(this.firestore, 'users', ownerId, 'tags');

      // 2. Push local standard & vault notes
      const localStandard = await this.noteRepo.findStandardByOwner(ownerId);
      const localVault = await this.noteRepo.findVaultByOwner(ownerId);
      const allLocalNotes: Note[] = [...localStandard, ...localVault];

      const batch = writeBatch(this.firestore);

      for (const note of allLocalNotes) {
        const noteDocRef = doc(notesColRef, note.id);
        if (note.kind === 'standard') {
          batch.set(noteDocRef, {
            id: note.id,
            ownerId: note.ownerId,
            kind: 'standard',
            title: note.title,
            plainText: note.plainText,
            content: bytesToBase64(note.content),
            tagIds: [...note.tagIds],
            color: note.color || null,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
            deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
          });
        } else {
          // Zero-knowledge: NO plaintext fields are sent to Firestore!
          batch.set(noteDocRef, {
            id: note.id,
            ownerId: note.ownerId,
            kind: 'vault',
            encryptedPayload: {
              version: note.encryptedPayload.version,
              iv: bytesToBase64(note.encryptedPayload.iv),
              ciphertext: bytesToBase64(note.encryptedPayload.ciphertext),
            },
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
            deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
          });
        }
        pushed += 1;
      }

      // 3. Push local tags
      const localTags = await this.tagRepo.findByOwner(ownerId);
      for (const tag of localTags) {
        const tagDocRef = doc(tagsColRef, tag.id);
        batch.set(tagDocRef, {
          id: tag.id,
          ownerId: tag.ownerId,
          name: tag.name,
          color: tag.color,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
          deletedAt: tag.deletedAt ? tag.deletedAt.toISOString() : null,
        });
        pushed += 1;
      }

      // Commit local pushes
      if (pushed > 0) {
        await batch.commit();
      }

      // 4. Pull remote notes
      const remoteNotesSnap = await getDocs(notesColRef);
      for (const docSnap of remoteNotesSnap.docs) {
        const data = docSnap.data();
        const remoteUpdated = new Date(data.updatedAt || Date.now());
        const parsedNoteId = parseNoteId(data.id || docSnap.id);
        if (!parsedNoteId.ok) continue;

        const noteId = parsedNoteId.value;
        const local = await this.noteRepo.findById(noteId);

        // If local is newer, do not overwrite
        if (local && local.updatedAt.getTime() >= remoteUpdated.getTime()) {
          continue;
        }

        if (data.kind === 'vault' && data.encryptedPayload) {
          const blob: EncryptedBlob = {
            version: data.encryptedPayload.version || 1,
            iv: base64ToBytes(data.encryptedPayload.iv),
            ciphertext: base64ToBytes(data.encryptedPayload.ciphertext),
          };
          const vaultNote: VaultNote = {
            id: noteId,
            ownerId,
            kind: 'vault',
            encryptedPayload: blob,
            createdAt: new Date(data.createdAt || Date.now()),
            updatedAt: remoteUpdated,
            deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
          };
          await this.noteRepo.save(vaultNote);
          pulled += 1;
        } else if (data.kind === 'standard') {
          const titleRes = createNoteTitle(data.title || '');
          const standardNote: StandardNote = {
            id: noteId,
            ownerId,
            kind: 'standard',
            title: titleRes.ok ? titleRes.value : (data.title || ''),
            plainText: data.plainText || '',
            content: toCrdtState(base64ToBytes(data.content || '')),
            tagIds: (data.tagIds || []) as readonly TagId[],
            color: data.color || undefined,
            createdAt: new Date(data.createdAt || Date.now()),
            updatedAt: remoteUpdated,
            deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
          };
          await this.noteRepo.save(standardNote);
          pulled += 1;
        }
      }

      // 5. Pull remote tags
      const remoteTagsSnap = await getDocs(tagsColRef);
      for (const docSnap of remoteTagsSnap.docs) {
        const data = docSnap.data();
        const remoteUpdated = new Date(data.updatedAt || Date.now());
        const parsedTagId = parseTagId(data.id || docSnap.id);
        if (!parsedTagId.ok) continue;

        const tagId = parsedTagId.value;
        const local = await this.tagRepo.findById(tagId);

        if (local && local.updatedAt.getTime() >= remoteUpdated.getTime()) {
          continue;
        }

        const nameRes = createTagName(data.name || 'Tag');
        const colorRes = createTagColor(data.color || DEFAULT_TAG_COLOR);

        if (nameRes.ok) {
          const tagEntity: Tag = {
            id: tagId,
            ownerId,
            name: nameRes.value,
            color: colorRes.ok ? colorRes.value : (DEFAULT_TAG_COLOR as TagColor),
            createdAt: new Date(data.createdAt || Date.now()),
            updatedAt: remoteUpdated,
            deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
          };
          await this.tagRepo.save(tagEntity);
          pulled += 1;
        }
      }

      return ok({ pushed, pulled });
    } catch (err_: any) {
      return err(new SyncFailedError(err_?.message || 'Firestore synchronization failed'));
    }
  }
}
