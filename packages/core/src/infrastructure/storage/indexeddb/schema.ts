import type { DBSchema } from 'idb';

export interface StoredStandardNoteRecord {
  id: string;
  ownerId: string;
  kind: 'standard';
  title: string;
  plainText: string;
  content: Uint8Array;
  tagIds: string[];
  color?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface StoredVaultNoteRecord {
  id: string;
  ownerId: string;
  kind: 'vault';
  iv: Uint8Array;
  ciphertext: Uint8Array;
  version: 1;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export type StoredNoteRecord = StoredStandardNoteRecord | StoredVaultNoteRecord;

export interface StoredTagRecord {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface StoredVaultRecord {
  ownerId: string;
  kdfAlgorithm: 'PBKDF2';
  kdfHash: 'SHA-256';
  kdfIterations: number;
  kdfSalt: Uint8Array;
  verifierIv: Uint8Array;
  verifierCiphertext: Uint8Array;
  verifierVersion: 1;
  createdAt: number;
}

export interface PronotesDbSchema extends DBSchema {
  notes: {
    key: string;
    value: StoredNoteRecord;
    indexes: {
      'by-owner': string;
      'by-kind': string;
      'by-updated': number;
    };
  };
  tags: {
    key: string;
    value: StoredTagRecord;
    indexes: {
      'by-owner': string;
      'by-name': string;
    };
  };
  vault: {
    key: string;
    value: StoredVaultRecord;
    indexes: {
      'by-owner': string;
    };
  };
}
