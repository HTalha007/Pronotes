import type { NoteId, TagId } from '../value-objects/ids';

/** Port: time source (deterministic in tests). */
export interface Clock {
  now(): Date;
}

/** Port: unique id generation (crypto.randomUUID in infrastructure). */
export interface IdGenerator {
  newNoteId(): NoteId;
  newTagId(): TagId;
}

/** Port: connectivity status. Going offline is a normal state, never an error. */
export interface ConnectivityMonitor {
  isOnline(): boolean;
}
