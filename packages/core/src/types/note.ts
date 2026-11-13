import { EncryptedPayload } from './crypto';

export type NoteType = 'standard' | 'vault';

export interface BaseNote {
  id: string;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface StandardNote extends BaseNote {
  type: 'standard';
  title: string;
  content: string; // Markdown or rich text representation
  yjsState?: string; // Base64 encoded Yjs update
  color?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface VaultNote extends BaseNote {
  type: 'vault';
  /** Encrypted blob containing title, content and Yjs state in AES-256-GCM format */
  encryptedData: EncryptedPayload;
}

export type Note = StandardNote | VaultNote;
