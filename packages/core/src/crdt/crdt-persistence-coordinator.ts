import * as Y from 'yjs';
import { YjsDocumentManager } from './yjs-document-manager';
import type { NoteId } from '../domain/value-objects/ids';

export type SaveSnapshotCallback = (params: {
  noteId: NoteId;
  snapshot: Uint8Array;
  plainText: string;
}) => Promise<void> | void;

export interface CoordinatorOptions {
  /** Debounce delay in milliseconds before persisting snapshot. Default: 1500ms */
  debounceMs?: number;
  /** Maximum wait time in milliseconds before forcing a snapshot during continuous typing. Default: 10000ms */
  maxWaitMs?: number;
}

export class CrdtPersistenceCoordinator {
  private readonly debounceMs: number;
  private readonly maxWaitMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private isDirty = false;
  private doc: Y.Doc | null = null;
  private noteId: NoteId | null = null;
  private onSave: SaveSnapshotCallback | null = null;
  private updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null;

  constructor(options: CoordinatorOptions = {}) {
    this.debounceMs = options.debounceMs ?? 1500;
    this.maxWaitMs = options.maxWaitMs ?? 10_000;
  }

  attach(noteId: NoteId, doc: Y.Doc, onSave: SaveSnapshotCallback): void {
    if (this.doc) {
      this.flush();
      this.detach();
    }

    this.noteId = noteId;
    this.doc = doc;
    this.onSave = onSave;
    this.isDirty = false;

    this.updateHandler = () => {
      this.markDirty();
    };

    doc.on('update', this.updateHandler);
  }

  markDirty(): void {
    this.isDirty = true;

    // Reset debounce timer on every new keystroke/update
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);

    // Setup maxWait timer if not already active to avoid starving saves
    if (!this.maxWaitTimer && this.maxWaitMs > 0) {
      this.maxWaitTimer = setTimeout(() => {
        this.flush();
      }, this.maxWaitMs);
    }
  }

  async flush(): Promise<void> {
    if (!this.isDirty || !this.doc || !this.noteId || !this.onSave) {
      this.clearTimers();
      return;
    }

    this.clearTimers();
    this.isDirty = false;

    const snapshot = YjsDocumentManager.createSnapshot(this.doc);
    const plainText = YjsDocumentManager.extractPlainText(this.doc, 'content');

    await this.onSave({
      noteId: this.noteId,
      snapshot,
      plainText,
    });
  }

  getIsDirty(): boolean {
    return this.isDirty;
  }

  detach(): void {
    this.clearTimers();
    if (this.doc && this.updateHandler) {
      this.doc.off('update', this.updateHandler);
    }
    this.doc = null;
    this.noteId = null;
    this.onSave = null;
    this.updateHandler = null;
    this.isDirty = false;
  }

  async destroy(): Promise<void> {
    await this.flush();
    this.detach();
  }

  private clearTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.maxWaitTimer) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }
  }
}

export interface LifecycleTargetWindow {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface LifecycleTargetDocument {
  visibilityState: string;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/**
 * Attaches browser lifecycle listeners (pagehide and visibilitychange)
 * to automatically trigger flush() when the user switches tabs or closes the page.
 * Returns an unregister function for cleanup.
 */
export function registerLifecycleFlush(
  coordinator: CrdtPersistenceCoordinator,
  targetWindow?: LifecycleTargetWindow,
  targetDocument?: LifecycleTargetDocument,
): () => void {
  const win = targetWindow ?? (typeof window !== 'undefined' ? (window as unknown as LifecycleTargetWindow) : null);
  const doc = targetDocument ?? (typeof document !== 'undefined' ? (document as unknown as LifecycleTargetDocument) : null);

  const onVisibilityChange = () => {
    if (doc && doc.visibilityState === 'hidden') {
      coordinator.flush();
    }
  };

  const onPageHide = () => {
    coordinator.flush();
  };

  if (doc) {
    doc.addEventListener('visibilitychange', onVisibilityChange);
  }
  if (win) {
    win.addEventListener('pagehide', onPageHide);
  }

  return () => {
    if (doc) {
      doc.removeEventListener('visibilitychange', onVisibilityChange);
    }
    if (win) {
      win.removeEventListener('pagehide', onPageHide);
    }
  };
}
