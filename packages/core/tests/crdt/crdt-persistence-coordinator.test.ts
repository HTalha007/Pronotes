import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import {
  CrdtPersistenceCoordinator,
  registerLifecycleFlush,
  type LifecycleTargetDocument,
  type LifecycleTargetWindow,
} from '../../src/crdt/crdt-persistence-coordinator';
import { YjsDocumentManager } from '../../src/crdt/yjs-document-manager';
import { parseNoteId } from '../../src/domain/value-objects/ids';
import { expectOk } from '../support/fakes';

describe('CrdtPersistenceCoordinator', () => {
  const noteId = expectOk(parseNoteId('test-note-persistence'));

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debounces multiple rapid document updates into a single save after 1.5s', async () => {
    const { doc } = YjsDocumentManager.createNoteDoc(noteId);
    const saveFn = vi.fn();

    const coordinator = new CrdtPersistenceCoordinator({ debounceMs: 1500 });
    coordinator.attach(noteId, doc, saveFn);

    const fragment = doc.getXmlFragment('content');

    // Simulate 4 rapid keystrokes 300ms apart
    for (let i = 0; i < 4; i++) {
      const p = new Y.XmlElement('paragraph');
      p.insert(0, [new Y.XmlText(`Kelime ${i + 1}`)]);
      fragment.insert(0, [p]);
      vi.advanceTimersByTime(300);
      expect(saveFn).not.toHaveBeenCalled();
    }

    // Since 300ms elapsed in the last iteration of the loop, advance 1199ms more to reach 1499ms total
    vi.advanceTimersByTime(1199);
    expect(saveFn).not.toHaveBeenCalled();

    // Now advance 2ms more to cross the 1500ms threshold (1501ms total)
    vi.advanceTimersByTime(2);
    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId,
        snapshot: expect.any(Uint8Array),
        plainText: expect.stringContaining('Kelime 4'),
      }),
    );
    expect(coordinator.getIsDirty()).toBe(false);

    coordinator.detach();
  });

  it('flushes immediately on demand without waiting for debounce timer', async () => {
    const { doc } = YjsDocumentManager.createNoteDoc(noteId);
    const saveFn = vi.fn();

    const coordinator = new CrdtPersistenceCoordinator({ debounceMs: 1500 });
    coordinator.attach(noteId, doc, saveFn);

    doc.getXmlFragment('content').insert(0, [new Y.XmlText('Anında Kaydet')]);
    expect(coordinator.getIsDirty()).toBe(true);
    expect(saveFn).not.toHaveBeenCalled();

    // Call flush immediately
    await coordinator.flush();

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(coordinator.getIsDirty()).toBe(false);

    // Advancing timers should not cause a duplicate save
    vi.advanceTimersByTime(2000);
    expect(saveFn).toHaveBeenCalledTimes(1);

    coordinator.detach();
  });

  it('does not trigger save if document is not dirty', async () => {
    const { doc } = YjsDocumentManager.createNoteDoc(noteId);
    const saveFn = vi.fn();

    const coordinator = new CrdtPersistenceCoordinator({ debounceMs: 1500 });
    coordinator.attach(noteId, doc, saveFn);

    await coordinator.flush();
    expect(saveFn).not.toHaveBeenCalled();

    coordinator.detach();
  });

  it('forces snapshot save when maxWait is reached during continuous non-stop typing', async () => {
    const { doc } = YjsDocumentManager.createNoteDoc(noteId);
    const saveFn = vi.fn();

    // Debounce is 1000ms, maxWait is 3000ms
    const coordinator = new CrdtPersistenceCoordinator({ debounceMs: 1000, maxWaitMs: 3000 });
    coordinator.attach(noteId, doc, saveFn);

    // Keep typing every 500ms (preventing debounce timer from completing)
    for (let elapsed = 0; elapsed < 2500; elapsed += 500) {
      doc.getXmlFragment('content').insert(0, [new Y.XmlText(`char `)]);
      vi.advanceTimersByTime(500);
      expect(saveFn).not.toHaveBeenCalled();
    }

    // Now advance past 3000ms total
    vi.advanceTimersByTime(600);
    expect(saveFn).toHaveBeenCalledTimes(1);

    coordinator.detach();
  });

  it('flushes and cleans up on destroy()', async () => {
    const { doc } = YjsDocumentManager.createNoteDoc(noteId);
    const saveFn = vi.fn();

    const coordinator = new CrdtPersistenceCoordinator({ debounceMs: 1500 });
    coordinator.attach(noteId, doc, saveFn);

    doc.getXmlFragment('content').insert(0, [new Y.XmlText('Kapanış Öncesi')]);
    expect(coordinator.getIsDirty()).toBe(true);

    await coordinator.destroy();

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(coordinator.getIsDirty()).toBe(false);

    // Subsequent updates to doc shouldn't trigger anything since it's detached
    doc.getXmlFragment('content').insert(0, [new Y.XmlText('Kapanış Sonrası')]);
    vi.advanceTimersByTime(2000);
    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  describe('registerLifecycleFlush', () => {
    it('triggers coordinator.flush() when tab becomes hidden (visibilitychange)', async () => {
      const { doc } = YjsDocumentManager.createNoteDoc(noteId);
      const saveFn = vi.fn();

      const coordinator = new CrdtPersistenceCoordinator();
      coordinator.attach(noteId, doc, saveFn);

      doc.getXmlFragment('content').insert(0, [new Y.XmlText('Sekme Arka Planda')]);

      const listeners: Record<string, () => void> = {};
      const mockDoc: LifecycleTargetDocument = {
        visibilityState: 'hidden',
        addEventListener: (event, cb) => {
          listeners[event] = cb;
        },
        removeEventListener: (event) => {
          delete listeners[event];
        },
      };

      const unregister = registerLifecycleFlush(coordinator, undefined, mockDoc);

      // Trigger visibility change to hidden
      listeners['visibilitychange']?.();

      expect(saveFn).toHaveBeenCalledTimes(1);

      unregister();
      expect(listeners['visibilitychange']).toBeUndefined();
      coordinator.detach();
    });

    it('triggers coordinator.flush() on pagehide event (browser close/navigate)', async () => {
      const { doc } = YjsDocumentManager.createNoteDoc(noteId);
      const saveFn = vi.fn();

      const coordinator = new CrdtPersistenceCoordinator();
      coordinator.attach(noteId, doc, saveFn);

      doc.getXmlFragment('content').insert(0, [new Y.XmlText('Sayfa Kapanıyor')]);

      const winListeners: Record<string, () => void> = {};
      const mockWin: LifecycleTargetWindow = {
        addEventListener: (event, cb) => {
          winListeners[event] = cb;
        },
        removeEventListener: (event) => {
          delete winListeners[event];
        },
      };

      const unregister = registerLifecycleFlush(coordinator, mockWin, undefined);

      // Trigger pagehide
      winListeners['pagehide']?.();

      expect(saveFn).toHaveBeenCalledTimes(1);

      unregister();
      expect(winListeners['pagehide']).toBeUndefined();
      coordinator.detach();
    });
  });
});
